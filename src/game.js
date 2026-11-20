export const HOUR = 3600000;
export const MINUTE = 60000;
export const WEEK = 168 * HOUR;
export const SAVE_KEY = 'flight-scheduler-save';
export const PROGRESS_KEY = 'flight-scheduler-progress';
export const SAVE_VERSION = 1;

export function getBlocks(dataset) {
    return dataset.rotations.map((r) => {
        const outbound = dataset.flights.find((f) => f.id === r.outboundId);
        const inbound = dataset.flights.find((f) => f.id === r.inboundId);
        const start = Date.parse(outbound.scheduledDeparture);
        const outEnd = Date.parse(outbound.scheduledArrival);
        const inStart = Date.parse(inbound.scheduledDeparture);
        const arrival = Date.parse(inbound.scheduledArrival);
        return {
            ...r,
            outbound,
            inbound,
            start,
            outEnd,
            inStart,
            arrival,
            end: arrival + r.turnaroundMinutes * MINUTE,
            hours: (outEnd - start + arrival - inStart) / HOUR,
            cycles: 2,
        };
    });
}

export function solveSchedule(dataset) {
    const blocks = getBlocks(dataset).sort((a, b) => a.start - b.start || a.end - b.end);
    const states = dataset.aircraft.map((aircraft) => ({
        aircraft,
        end: dataset.weekStart,
        hours: aircraft.initialHours,
        cycles: aircraft.initialCycles,
        count: 0,
    }));
    const assignments = [];
    for (const block of blocks) {
        const candidates = states
            .filter((state) => {
                const maintenance = dataset.maintenance.filter(
                    (item) => item.aircraftId === state.aircraft.id,
                );
                return (
                    state.end <= block.start &&
                    state.hours + block.hours <= dataset.rules.maxHours &&
                    state.cycles + block.cycles <= dataset.rules.maxCycles &&
                    !maintenance.some((item) => item.start < block.end && item.end > block.start)
                );
            })
            .sort((a, b) => a.count - b.count || b.end - a.end || a.hours - b.hours);
        const state = candidates[0];
        if (!state) throw new Error(`${block.outbound.number}편을 배정할 수 있는 기체가 없습니다.`);
        assignments.push({ rotationId: block.id, aircraftId: state.aircraft.id });
        state.end = block.end;
        state.hours += block.hours;
        state.cycles += block.cycles;
        state.count += 1;
    }
    return assignments;
}

export function validate(dataset, assignments, repeat = false) {
    const blocks = getBlocks(dataset);
    const issues = [];
    const add = (code, message, aircraftId, blockId) => issues.push({ code, message, aircraftId, blockId });
    for (const a of assignments) {
        if (
            !blocks.some((b) => b.id === a.rotationId) ||
            !dataset.aircraft.some((p) => p.id === a.aircraftId)
        )
            add('invalid', '알 수 없는 왕복편 또는 기체입니다.', a.aircraftId, a.rotationId);
    }
    for (const b of blocks) {
        const matches = assignments.filter((a) => a.rotationId === b.id);
        if (!matches.length && b.required)
            add('unassigned', `${b.outbound.number} ${b.outbound.to} 필수 왕복편 미배정`, null, b.id);
        if (matches.length > 1) add('duplicate', `${b.outbound.number} 중복 배정`, null, b.id);
        if (
            !(b.start < b.outEnd && b.outEnd <= b.inStart && b.inStart < b.arrival) ||
            b.outbound.to !== b.inbound.from ||
            b.outbound.from !== b.inbound.to
        )
            add('pair', `${b.outbound.number} 왕복 연결 오류`, null, b.id);
        if (b.inStart - b.outEnd < dataset.rules.destinationMinimumMinutes * MINUTE)
            add('destination-ready', `${b.outbound.number} 현지 준비 시간 부족`, null, b.id);
    }
    for (const plane of dataset.aircraft) {
        const assigned = assignments
            .filter((a) => a.aircraftId === plane.id)
            .map((a) => blocks.find((b) => b.id === a.rotationId))
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        const hours = plane.initialHours + assigned.reduce((sum, b) => sum + b.hours, 0);
        const cycles = plane.initialCycles + assigned.reduce((sum, b) => sum + b.cycles, 0);
        if (hours > dataset.rules.maxHours)
            add('hours', `${plane.id} 운항 한도 ${dataset.rules.maxHours}시간 초과`, plane.id);
        if (cycles > dataset.rules.maxCycles)
            add('cycles', `${plane.id} 사이클 한도 ${dataset.rules.maxCycles}회 초과`, plane.id);
        const maintenance = dataset.maintenance.filter((m) => m.aircraftId === plane.id);
        let events = [
            ...assigned.map((b) => ({ ...b, from: b.outbound.from, to: b.inbound.to, arrival: b.arrival })),
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
        let airport = boundary?.previous.airport ?? plane.startAirport;
        if (!repeat && events.length && boundary && events[0].start < boundary.previous.ready)
            add('boundary-start', `${plane.id} 직전 주 준비 시간 부족`, plane.id, events[0].id);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            const relevant = !repeat || e.shift === 0;
            if (relevant && airport !== e.from)
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
            if (airport !== boundary.next.airport)
                add('boundary-airport', `${plane.id} 다음 주 시작 공항 불일치`, plane.id, last.id);
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
    const loads = dataset.aircraft.map((p) => {
        const own = blocks.filter((b) =>
            assignments.some((a) => a.rotationId === b.id && a.aircraftId === p.id),
        );
        return {
            id: p.id,
            hours: p.initialHours + own.reduce((s, b) => s + b.hours, 0),
            cycles: p.initialCycles + own.length * 2,
            count: own.length,
        };
    });
    const used = loads.filter((p) => p.count).length;
    const spread = (key) => {
        const mean = loads.reduce((s, p) => s + p[key], 0) / loads.length;
        return mean ? loads.reduce((s, p) => s + Math.abs(p[key] - mean), 0) / (loads.length * mean) : 0;
    };
    const margins = [];
    for (const p of dataset.aircraft) {
        const own = blocks
            .filter((b) => assignments.some((a) => a.rotationId === b.id && a.aircraftId === p.id))
            .sort((a, b) => a.start - b.start);
        own.forEach((b, i) => {
            margins.push(
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
    const flightHours = required.reduce((s, b) => s + b.hours, 0);
    const fuel = flightHours * dataset.rules.fuelPerHour;
    const maintenanceReserve =
        flightHours * dataset.rules.reservePerHour + required.length * 2 * dataset.rules.reservePerCycle;
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
        assignments: assignments.map((a) => ({ rotationId: a.rotationId, aircraftId: a.aircraftId })),
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
            !dataset.rotations.some((r) => r.id === a.rotationId) ||
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
