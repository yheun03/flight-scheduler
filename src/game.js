export const HOUR = 3600000;
export const MINUTE = 60000;
export const WEEK = 168 * HOUR;
export const SAVE_KEY = 'flight-scheduler-save';
export const PROGRESS_KEY = 'flight-scheduler-progress';
export const SAVE_VERSION = 1;

export function getBlocks(dataset) {
    const flights = new Map(dataset.flights.map((flight) => [flight.id, flight]));
    return dataset.rotations.map((r) => {
        const outbound = flights.get(r.outboundId);
        const inbound = flights.get(r.inboundId) || outbound;
        const single = !r.inboundId;
        const start = Date.parse(outbound.scheduledDeparture);
        const outEnd = Date.parse(outbound.scheduledArrival);
        const inStart = single ? outEnd : Date.parse(inbound.scheduledDeparture);
        const arrival = Date.parse(inbound.scheduledArrival);
        return {
            ...r, single,
            outbound,
            inbound,
            start,
            outEnd,
            inStart,
            arrival,
            end: arrival + r.turnaroundMinutes * MINUTE,
            hours: (outEnd - start + arrival - inStart) / HOUR,
            cycles: single ? 1 : 2,
        };
    });
}

// A positioning flight is a game assumption, measured in block time.
function ferryDuration(dataset, from, to) {
    if (!from || from === to) return Infinity;
    if ([from, to].every((code) => ['GMP', 'ICN'].includes(code))) return 45;
    const a = dataset.airportLocations?.[from]?.coordinates;
    const b = dataset.airportLocations?.[to]?.coordinates;
    if (!a || !b) return Infinity;
    const radians = Math.PI / 180;
    const h = Math.sin((b[0] - a[0]) * radians / 2) ** 2 +
        Math.cos(a[0] * radians) * Math.cos(b[0] * radians) * Math.sin((b[1] - a[1]) * radians / 2) ** 2;
    const km = 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
    return Math.ceil((30 + km / 750 * 60) / 5) * 5;
}
export function manualFerry(dataset, assignment) {
    const match = /^ferry:([A-Z]{3}):([A-Z]{3}):(\d{13}):(.+)$/.exec(assignment?.rotationId || '');
    if (!match || match[4] !== assignment.aircraftId || !dataset.pending) return null;
    const [, from, to, timestamp] = match;
    const start = Number(timestamp), minutes = ferryDuration(dataset, from, to);
    if (!Number.isFinite(minutes) || start < dataset.weekStart || start >= dataset.weekEnd) return null;
    const arrival = start + minutes * MINUTE;
    return { id: assignment.rotationId, aircraftId: assignment.aircraftId, from, to, start, arrival,
        end: arrival + dataset.rules.destinationMinimumMinutes * MINUTE, active: true, manual: true, minutes };
}
export function ferryCost(dataset, minutes) {
    return minutes / 60 * (dataset.rules.fuelPerHour + dataset.rules.reservePerHour) + dataset.rules.reservePerCycle;
}
export function ferryConnections(dataset, assignments, blocks = getBlocks(dataset)) {
    const byId = new Map(blocks.map((b) => [b.id, b]));
    const requested = new Set(assignments.filter((a) => a.ferryAfter).map((a) => a.rotationId));
    const last = new Map();
    const options = assignments.map((a) => manualFerry(dataset, a)).filter(Boolean);
    const manual = [...options];
    for (const a of assignments.filter((a) => byId.has(a.rotationId)).slice()
        .sort((a,b) => byId.get(a.rotationId).start - byId.get(b.rotationId).start)) {
        const block = byId.get(a.rotationId), previous = last.get(a.aircraftId);
        if (previous && block.single && !manual.some((f) => f.aircraftId === a.aircraftId && f.start >= previous.end && f.start < block.start)) {
            const ferryMinutes = ferryDuration(dataset, previous.inbound.to, block.outbound.from);
            const end = previous.end + (ferryMinutes + block.turnaroundMinutes) * MINUTE;
            if (end <= block.start && !dataset.maintenance.some((m) => m.aircraftId === a.aircraftId && m.start < end && m.end > previous.end)) options.push({ id: block.id, aircraftId: a.aircraftId,
                minutes: ferryMinutes, from: previous.inbound.to, to: block.outbound.from, start: previous.end,
                arrival: previous.end + ferryMinutes * MINUTE, end, active: a.ferryFrom === previous.id || requested.has(previous.id), previous: previous.id });
        }
        last.set(a.aircraftId, block);
    }
    return options;
}

function planSchedule(dataset, attempt = 0) {
    let seed = attempt;
    const priority = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const blocks = getBlocks(dataset).sort((a, b) => a.start - b.start || a.end - b.end);
    const earlyEnd = dataset.weekStart + 72 * HOUR;
    const earlyShare = Math.ceil(blocks.filter((b) => b.start < earlyEnd).length / dataset.aircraft.length);
    const hasMultipleBases = new Set(blocks.map((block) => block.outbound.from)).size > 1;
    const states = dataset.aircraft.map((aircraft) => ({
        aircraft,
        end: dataset.weekStart,
        airport: null,
        hours: aircraft.initialHours,
        cycles: aircraft.initialCycles,
        count: 0,
    }));
    const assignments = [];
    for (const block of blocks) {
        if (attempt) for (const s of states) s.rank = priority();
        const candidates = states
            .filter((state) => {
                const maintenance = dataset.maintenance.filter(
                    (item) => item.aircraftId === state.aircraft.id,
                );
                return (
                    state.end <= block.start &&
                    (!state.airport || state.airport === block.outbound.from) &&
                    state.hours + block.hours <= dataset.rules.maxHours &&
                    state.cycles + block.cycles <= dataset.rules.maxCycles &&
                    !maintenance.some((item) => item.start < block.end && item.end > block.start)
                );
            })
            .sort(
                (a, b) =>
                    (attempt ? Number(!a.airport) - Number(!b.airport) || a.rank - b.rank : 0) ||
                    (block.single && !attempt && block.start < earlyEnd
                        ? Number(a.count >= earlyShare) - Number(b.count >= earlyShare) : 0) ||
                    (block.single ? Number(!a.airport) - Number(!b.airport) || a.hours - b.hours : 0) ||
                    (hasMultipleBases
                        ? Number(!a.airport) - Number(!b.airport) || a.count - b.count
                        : a.count - b.count || Number(!a.airport) - Number(!b.airport)) ||
                    b.end - a.end ||
                    a.hours - b.hours,
            );
        let state = candidates[0];
        let ferryFrom, ferryMinutes = 0;
        if (!state && block.single) {
            const options = states.map((s) => ({ s, minutes: ferryDuration(dataset, s.airport, block.outbound.from) }))
                .filter(({ s, minutes }) => s.end + (minutes + block.turnaroundMinutes) * MINUTE <= block.start &&
                    s.hours + block.hours + minutes / 60 <= dataset.rules.maxHours && s.cycles + 2 <= dataset.rules.maxCycles)
                .sort((a, b) => a.minutes - b.minutes || a.s.hours - b.s.hours);
            if (options.length) {
                state = options[0].s;
                ferryFrom = state.previous;
                ferryMinutes = options[0].minutes;
            }
        }
        if (!state && block.single) {
            // Keep the published flight visible and let validation flag the unresolved connection.
            state = states.slice().sort((a,b) => Number(a.end > block.start) - Number(b.end > block.start)
                || Number(a.airport !== block.outbound.from) - Number(b.airport !== block.outbound.from)
                || a.end - b.end)[0];
        }
        if (!state) throw new Error(`${block.outbound.number}편을 배정할 수 있는 기체가 없습니다.`);
        assignments.push({ rotationId: block.id, aircraftId: state.aircraft.id, ...(ferryFrom ? { ferryFrom } : {}) });
        state.previous = block.id;
        state.end = block.end;
        state.airport = block.inbound.to;
        state.hours += block.hours + (ferryFrom ? ferryMinutes / 60 : 0);
        state.cycles += block.cycles + Number(Boolean(ferryFrom));
        state.count += 1;
    }
    return assignments;
}

// Move a leading sequence to an idle aircraft only when it joins its next
// departure at the same airport. Published legs and their times stay fixed.
function distributeEarlyFlights(dataset, plan) {
    const byId = new Map(getBlocks(dataset).map((b) => [b.id, b]));
    const schedules = new Map(dataset.aircraft.map((p) => [p.id, []]));
    for (const a of plan) schedules.get(a.aircraftId).push(byId.get(a.rotationId));
    const cutoff = dataset.weekStart + 72 * HOUR;
    const transfers = new Map();
    for (const [id, receiver] of schedules) {
        if (receiver[0]?.start < cutoff) continue;
        for (const donor of schedules.values()) {
            if (donor.length < 2 || donor[0].start >= cutoff) continue;
            const last = donor.findIndex((b, index) => donor[index + 1]?.start < cutoff &&
                (!receiver.length || (b.end <= receiver[0].start && b.inbound.to === receiver[0].outbound.from)));
            if (last < 0) continue;
            const prefix = donor.slice(0, last + 1);
            const plane = dataset.aircraft.find((p) => p.id === id);
            const combined = [...prefix, ...receiver];
            if (combined.reduce((h,b) => h + b.hours, plane.initialHours) > dataset.rules.maxHours ||
                combined.length + plane.initialCycles > dataset.rules.maxCycles) continue;
            donor.splice(0, prefix.length);
            receiver.unshift(...prefix);
            for (const b of prefix) transfers.set(b.id, id);
            break;
        }
    }
    if (!transfers.size) return plan;
    const balanced = plan.map((a) => transfers.has(a.rotationId) ? { ...a, aircraftId: transfers.get(a.rotationId) } : a);
    return validate(dataset, balanced).length ? plan : balanced;
}

export function solveSchedule(dataset, current = []) {
    const first = planSchedule(dataset);
    if (!dataset.pending) return first;
    let best = first;
    let result = evaluate(dataset, best);
    function consider(plan) {
        const candidate = evaluate(dataset, plan);
        if (candidate.completed !== candidate.total) return;
        if (candidate.issues.length < result.issues.length ||
            (candidate.issues.length === result.issues.length && (candidate.score > result.score ||
            (candidate.score === result.score && candidate.totalCost < result.totalCost)))) {
            best = plan;
            result = candidate;
        }
    }
    consider(distributeEarlyFlights(dataset, first));
    for (let attempt = 1; attempt <= 512; attempt++) {
        if (attempt > 24 && !result.issues.length) break;
        const plan = planSchedule(dataset, attempt);
        consider(plan);
        const balanced = distributeEarlyFlights(dataset, plan);
        if (balanced !== plan) consider(balanced);
    }
    if (current.length) consider(current);
    return best;
}

export function validate(dataset, assignments, repeat = false) {
    const blocks = getBlocks(dataset);
    const issues = [];
    const add = (code, message, aircraftId, blockId) => issues.push({ code, message, aircraftId, blockId });
    for (const a of assignments) {
        if (
            (!blocks.some((b) => b.id === a.rotationId) && !manualFerry(dataset, a)) ||
            !dataset.aircraft.some((p) => p.id === a.aircraftId)
        )
            add('invalid', '알 수 없는 왕복편 또는 기체입니다.', a.aircraftId, a.rotationId);
    }
    for (const b of blocks) {
        const matches = assignments.filter((a) => a.rotationId === b.id);
        if (!matches.length && b.required)
            add('unassigned', `${b.outbound.number} ${b.outbound.to} 필수 왕복편 미배정`, null, b.id);
        if (matches.length > 1) add('duplicate', `${b.outbound.number} 중복 배정`, null, b.id);
        if (b.single) continue;
        if (
            !(b.start < b.outEnd && b.outEnd <= b.inStart && b.inStart < b.arrival) ||
            b.outbound.to !== b.inbound.from ||
            b.outbound.from !== b.inbound.to
        )
            add('pair', `${b.outbound.number} 왕복 연결 오류`, null, b.id);
        if (b.inStart - b.outEnd < dataset.rules.destinationMinimumMinutes * MINUTE)
            add('destination-ready', `${b.outbound.number} 현지 준비 시간 부족`, null, b.id);
    }
    const ferries = ferryConnections(dataset, assignments, blocks).filter((f) => f.active);
    for (const plane of dataset.aircraft) {
        const ownFerries = ferries.filter((f) => f.aircraftId === plane.id);
        const assigned = assignments
            .filter((a) => a.aircraftId === plane.id)
            .map((a) => blocks.find((b) => b.id === a.rotationId))
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        const hours = plane.initialHours + ownFerries.reduce((sum, f) => sum + f.minutes / 60, 0) + assigned.reduce((sum, b) => sum + b.hours, 0);
        const cycles = plane.initialCycles + assigned.reduce((sum, b) => sum + b.cycles, ownFerries.length);
        if (hours > dataset.rules.maxHours)
            add('hours', `${plane.id} 운항 한도 ${dataset.rules.maxHours}시간 초과`, plane.id);
        if (cycles > dataset.rules.maxCycles)
            add('cycles', `${plane.id} 사이클 한도 ${dataset.rules.maxCycles}회 초과`, plane.id);
        const maintenance = dataset.maintenance.filter((m) => m.aircraftId === plane.id);
        let events = [
            ...assigned.map((b) => ({ ...b, from: b.outbound.from, to: b.inbound.to, arrival: b.arrival })),
            ...ownFerries,
            ...maintenance.map((m) => ({
                ...m,
                from: m.airport,
                to: m.airport,
                arrival: m.end,
                maintenance: true,
            })),
        ];
        if (repeat)
            events = [-WEEK, 0, WEEK].flatMap((shift) =>
                events.map((e) => ({
                    ...e,
                    start: e.start + shift,
                    end: e.end + shift,
                    arrival: e.arrival + shift,
                    shift,
                })),
            );
        events.sort((a, b) => a.start - b.start);
        const boundary = dataset.boundaries.find((b) => b.aircraftId === plane.id);
        let airport = null;
        if (!repeat && events.length && boundary && events[0].start < boundary.previous.ready)
            add('boundary-start', `${plane.id} 직전 주 준비 시간 부족`, plane.id, events[0].id);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            const relevant = !repeat || e.shift === 0;
            if (relevant && airport && airport !== e.from)
                add(
                    'airport',
                    `${plane.id} ${airport}에서 ${e.from}(으)로 자동 이동할 수 없습니다.`,
                    plane.id,
                    e.id,
                );
            for (let j = 0; j < i; j++) {
                const prev = events[j];
                if (prev.end > e.start && (!repeat || prev.shift === 0 || e.shift === 0)) {
                    const code =
                        prev.maintenance || e.maintenance
                            ? 'maintenance'
                            : prev.arrival > e.start
                              ? 'overlap'
                              : 'turnaround';
                    add(
                        code,
                        `${plane.id} ${code === 'maintenance' ? '필수 정비와 운항 중복' : code === 'turnaround' ? '귀환 후 준비 시간 부족' : '운항 시간 중복'}`,
                        plane.id,
                        e.maintenance ? prev.id : e.id,
                    );
                }
            }
            airport = e.to;
        }
        if (!repeat && events.length && boundary) {
            const last = events.at(-1);
            if (last.end > boundary.next.departure)
                add('boundary-end', `${plane.id} 다음 주 출발 전 준비 시간 부족`, plane.id, last.id);
        }
    }
    return issues.filter(
        (issue, index, list) =>
            list.findIndex(
                (x) =>
                    x.code === issue.code &&
                    x.aircraftId === issue.aircraftId &&
                    x.blockId === issue.blockId &&
                    x.message === issue.message,
            ) === index,
    );
}

export function evaluate(dataset, assignments, repeat = false) {
    const blocks = getBlocks(dataset);
    const issues = validate(dataset, assignments, repeat);
    const assignedIds = new Set(
        assignments
            .filter((a) => dataset.aircraft.some((p) => p.id === a.aircraftId))
            .map((a) => a.rotationId),
    );
    const required = blocks.filter((b) => b.required);
    const completed = required.filter((b) => assignedIds.has(b.id)).length;
    const ratio = required.length ? completed / required.length : 1;
    const byPlane = new Map();
    const byId = new Map(blocks.map((block) => [block.id, block]));
    for (const { aircraftId, rotationId } of assignments) {
        if (!byId.has(rotationId)) continue;
        if (!byPlane.has(aircraftId)) byPlane.set(aircraftId, new Set());
        byPlane.get(aircraftId).add(byId.get(rotationId));
    }
    const ferries = ferryConnections(dataset, assignments, blocks).filter((f) => f.active);
    const loads = dataset.aircraft.map((p) => {
        const own = [...(byPlane.get(p.id) || [])];
        const ownFerries = ferries.filter((f) => f.aircraftId === p.id);
        const ferryCount = ownFerries.length;
        return {
            id: p.id,
            hours: p.initialHours + ownFerries.reduce((sum, f) => sum + f.minutes / 60, 0) + own.reduce((s, b) => s + b.hours, 0),
            cycles: p.initialCycles + own.reduce((sum, b) => sum + b.cycles, ferryCount),
            count: own.length, ferryCount,
        };
    });
    const used = loads.filter((p) => p.count || p.ferryCount).length;
    const spread = (key) => {
        const mean = loads.reduce((s, p) => s + p[key], 0) / loads.length;
        return mean ? loads.reduce((s, p) => s + Math.abs(p[key] - mean), 0) / (loads.length * mean) : 0;
    };
    const margins = [];
    for (const p of dataset.aircraft) {
        const own = [...(byPlane.get(p.id) || [])].sort((a, b) => a.start - b.start);
        own.forEach((b, i) => {
            if (!b.single) margins.push(
                Math.min(
                    1,
                    Math.max(
                        0,
                        (b.inStart - b.outEnd - dataset.rules.destinationMinimumMinutes * MINUTE) /
                            (dataset.rules.reserveMinutes * MINUTE),
                    ),
                ),
            );
            if (i)
                margins.push(
                    Math.min(
                        1,
                        Math.max(0, (b.start - own[i - 1].end) / (dataset.rules.reserveMinutes * MINUTE)),
                    ),
                );
        });
    }
    const operationalErrors = issues.filter((i) => i.code !== 'unassigned').length;
    const completion = 40 * ratio;
    const eligible = ratio === 1 ? 1 : 0;
    const resilience =
        (25 * eligible * (margins.length ? margins.reduce((s, n) => s + n, 0) / margins.length : 0)) /
        (1 + operationalErrors);
    const balance = 20 * eligible * Math.max(0, 1 - (spread('hours') + spread('cycles')) / 4);
    // 고정 필수 시간표의 연료와 정비 적립은 미배정 여부에 따라 줄지 않습니다.
    const flightHours = required.reduce((s, b) => s + b.hours, ferries.reduce((sum, f) => sum + f.minutes / 60, 0));
    const fuel = flightHours * dataset.rules.fuelPerHour;
    const maintenanceReserve =
        flightHours * dataset.rules.reservePerHour + required.reduce((sum, b) => sum + b.cycles, ferries.length) * dataset.rules.reservePerCycle;
    const mandatoryMaintenance = dataset.maintenance.length * dataset.rules.maintenanceCost;
    const activation = used * dataset.rules.activationCost;
    const efficiency = 15 * eligible * (1 - (used / dataset.aircraft.length) * 0.15);
    const parts = [completion, resilience, balance, efficiency].map((n) => Math.round(n * 10) / 10);
    const score = Math.round(parts.reduce((s, n) => s + n, 0));
    return {
        score,
        parts,
        issues,
        completed,
        total: required.length,
        used,
        loads,
        fuel,
        maintenanceReserve,
        mandatoryMaintenance,
        activation,
        totalCost: fuel + maintenanceReserve + mandatoryMaintenance + activation,
        cleared: completed === required.length && issues.length === 0 && score >= 80,
    };
}

export function makeSave(dataset, assignments, playId, repeat) {
    return {
        version: SAVE_VERSION,
        datasetId: dataset.id,
        assignments: assignments.map((a) => ({ rotationId: a.rotationId, aircraftId: a.aircraftId, ...(a.ferryFrom ? { ferryFrom: a.ferryFrom } : {}), ...(a.ferryAfter ? { ferryAfter: true } : {}) })),
        playId,
        repeat,
        savedAt: new Date().toISOString(),
    };
}
export function parseSave(raw, dataset) {
    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        throw new Error('저장 데이터가 손상되었습니다. 저장 초기화 후 다시 저장해 주세요.');
    }
    if (!value || value.version !== SAVE_VERSION || value.datasetId !== dataset.id)
        throw new Error(
            '저장 형식 또는 시간표 버전이 다릅니다. 해당 데이터셋을 선택하거나 저장을 초기화해 주세요.',
        );
    if (
        typeof value.playId !== 'string' ||
        !value.playId ||
        value.playId.length > 150 ||
        typeof value.repeat !== 'boolean' ||
        (dataset.kind !== 'fiction' && value.repeat) ||
        !Array.isArray(value.assignments)
    )
        throw new Error('저장 데이터의 구조가 올바르지 않습니다.');
    const seen = new Set();
    for (const a of value.assignments) {
        if (
            !a ||
            (!dataset.rotations.some((r) => r.id === a.rotationId) && !manualFerry(dataset, a)) ||
            !dataset.aircraft.some((p) => p.id === a.aircraftId) ||
            seen.has(a.rotationId)
        )
            throw new Error('저장 데이터에 잘못된 배정이나 중복 배정이 있습니다.');
        seen.add(a.rotationId);
    }
    return value;
}
export function recordClear(raw, playId, airline = 'airseoul') {
    let progress;
    try {
        progress = JSON.parse(raw || '{}');
    } catch {
        throw new Error('클리어 기록이 손상되어 기록을 갱신하지 않았습니다.');
    }
    if (
        !progress ||
        typeof progress !== 'object' ||
        Array.isArray(progress) ||
        (progress.clears && !Array.isArray(progress.clears))
    )
        throw new Error('클리어 기록 형식이 올바르지 않습니다.');
    const clears = progress.clears || [];
    if (clears.some((c) => !c || typeof c.playId !== 'string' || typeof c.airline !== 'string'))
        throw new Error('클리어 기록 형식이 올바르지 않습니다.');
    if (!clears.some((c) => c.playId === playId)) clears.push({ playId, airline });
    return {
        clears,
        masterClears: clears.filter((c) => c.airline === 'jinair').length,
        practicalUnlocked: clears.filter((c) => c.airline === 'jinair').length >= 3,
    };
}
