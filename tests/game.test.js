import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tutorial, practice, sources } from '../src/data/schedules.js';
import {
    getBlocks,
    validate,
    evaluate,
    makeSave,
    parseSave,
    recordClear,
    HOUR,
    MINUTE,
    WEEK,
} from '../src/game.js';
const copy = (value) => structuredClone(value);
const assignment = (dataset, index, aircraftId) => ({ rotationId: dataset.rotations[index].id, aircraftId });
const solution = () =>
    tutorial.rotations.map((r, i) => ({
        rotationId: r.id,
        aircraftId: ['AS01', 'AS02', 'AS03', 'AS04', 'AS05', 'AS06', 'AS01', 'AS02'][i],
    }));
const codes = (d, a, repeat = false) => validate(d, a, repeat).map((i) => i.code);
test('실제 부분 자료는 확인한 날짜에만 존재하고 원본은 예정편과 IANA 시간대를 보관한다', () => {
    assert.equal(tutorial.rotations.length, 8);
    assert.deepEqual(
        [...new Set(tutorial.flights.map((f) => f.departureDate))],
        ['2026-11-20', '2026-11-21'],
    );
    for (const f of tutorial.flights) {
        assert.equal(f.timeType, 'scheduled');
        assert.ok(f.departureTimeZone.includes('/'));
        assert.ok(f.arrivalTimeZone.includes('/'));
        assert.ok(sources.find((s) => s.id === f.sourceId));
    }
    assert.equal(new Set(practice.flights.map((f) => f.sourceId)).size, 1);
    assert.ok(practice.flights.every((f) => f.number.startsWith('FS')));
});
test('8개 필수 왕복을 6대에 배정하면 오류 없이 80점 이상 클리어 가능', () => {
    const result = evaluate(tutorial, solution());
    assert.equal(result.issues.length, 0);
    assert.equal(result.completed, 8);
    assert.ok(result.score >= 80);
    assert.ok(result.cleared);
});
test('첫 왕복의 출발 공항은 기체마다 고정하지 않는다', () => {
    assert.ok(!codes(tutorial, [assignment(tutorial, 0, 'AS05')]).includes('airport'));
});
test('연속 왕복의 도착 공항과 다음 출발 공항이 다르면 오류로 처리한다', () => {
    const d = copy(tutorial);
    const outbound = d.flights.find((f) => f.id === d.rotations[4].outboundId);
    const inbound = d.flights.find((f) => f.id === d.rotations[4].inboundId);
    outbound.scheduledDeparture = '2026-11-20T13:30:00+09:00';
    outbound.scheduledArrival = '2026-11-20T14:45:00+09:00';
    inbound.scheduledDeparture = '2026-11-20T15:15:00+09:00';
    inbound.scheduledArrival = '2026-11-20T16:30:00+09:00';
    assert.ok(codes(d, [assignment(d, 0, 'AS01'), assignment(d, 4, 'AS01')]).includes('airport'));
});
test('같은 기체의 겹치는 왕복과 중복 배정을 각각 검출한다', () => {
    assert.ok(
        codes(tutorial, [assignment(tutorial, 0, 'AS01'), assignment(tutorial, 1, 'AS01')]).includes(
            'overlap',
        ),
    );
    assert.ok(
        codes(tutorial, [assignment(tutorial, 0, 'AS01'), assignment(tutorial, 0, 'AS02')]).includes(
            'duplicate',
        ),
    );
    assert.ok(codes(tutorial, []).includes('unassigned'));
});
test('실제 두 제주 왕복은 비행이 겹치지 않아도 귀환 후 준비 10분 부족', () => {
    const errors = codes(tutorial, [assignment(tutorial, 4, 'AS05'), assignment(tutorial, 5, 'AS05')]);
    assert.ok(errors.includes('turnaround'));
    assert.ok(!errors.includes('overlap'));
});
test('현지 최소 준비 시간과 잘못된 왕복 연결도 검출한다', () => {
    const d = copy(tutorial);
    const inbound = d.flights.find((f) => f.id === d.rotations[0].inboundId);
    inbound.scheduledDeparture = '2026-11-20T09:20:00+09:00';
    assert.ok(codes(d, []).includes('destination-ready'));
    inbound.from = 'NRT';
    assert.ok(codes(d, []).includes('pair'));
});
test('필수 정비는 운항과 겹치면 오류이고 배정으로 제거되지 않는다', () => {
    const d = copy(tutorial);
    const b = getBlocks(d)[0];
    d.maintenance[0].start = b.start + HOUR;
    d.maintenance[0].end = b.start + 2 * HOUR;
    assert.ok(codes(d, [assignment(d, 0, 'AS01')]).includes('maintenance'));
    assert.equal(evaluate(d, []).mandatoryMaintenance, evaluate(d, solution()).mandatoryMaintenance);
});
test('초기 운항량과 사이클을 더해 한도 초과를 검출한다', () => {
    const d = copy(tutorial);
    d.aircraft[0].initialHours = 61;
    d.aircraft[0].initialCycles = 29;
    const errors = codes(d, [assignment(d, 0, 'AS01')]);
    assert.ok(errors.includes('hours'));
    assert.ok(errors.includes('cycles'));
});
test('나트랑 현지 시각을 UTC로 계산하고 자정과 화면 경계 이후 원본을 유지한다', () => {
    const b = getBlocks(practice).at(-1);
    assert.equal(b.outbound.arrivalTimeZone, 'Asia/Ho_Chi_Minh');
    assert.equal((b.outEnd - b.start) / HOUR, 5.5);
    assert.ok(Math.abs(b.hours - (5.5 + 4 + 55 / 60)) < 0.0001);
    assert.equal((b.inStart - b.outEnd) / MINUTE, 60);
    assert.equal(b.cycles, 2);
    assert.ok(b.end > practice.weekEnd);
    assert.ok(b.arrival > b.inStart);
});
test('직전 주 준비 완료와 다음 주 출발 시간 경계를 검사한다', () => {
    const d = copy(tutorial);
    d.boundaries[0].previous.ready = getBlocks(d)[0].start + MINUTE;
    assert.ok(codes(d, [assignment(d, 0, 'AS01')]).includes('boundary-start'));
    d.boundaries[0].previous.ready = d.weekStart;
    d.boundaries[0].next.departure = getBlocks(d)[0].end - MINUTE;
    const errors = codes(d, [assignment(d, 0, 'AS01')]);
    assert.ok(errors.includes('boundary-end'));
});
test('주간 반복은 직전 주 일요일 심야와 이번 주 월요일을 함께 검사한다', () => {
    const d = copy(practice);
    const monday = getBlocks(d)[0];
    const night = getBlocks(d).at(-1);
    const values = [assignment(d, 0, 'AS01'), assignment(d, d.rotations.length - 1, 'AS01')];
    assert.ok(night.end - WEEK > monday.start);
    assert.ok(codes(d, values, true).includes('overlap') || codes(d, values, true).includes('turnaround'));
    assert.ok(!codes(d, values, false).includes('overlap'));
});
test('다음 주 경계도 검사하며 화면 밖 종료를 잘라 계산하지 않는다', () => {
    const d = copy(practice);
    d.boundaries[0].next.departure = d.weekEnd + 7 * HOUR;
    assert.ok(codes(d, [assignment(d, d.rotations.length - 1, 'AS01')]).includes('boundary-end'));
});
test('기체 변경으로 고정 연료와 시간/사이클 정비 적립이 바뀌지 않는다', () => {
    const original = evaluate(tutorial, solution());
    const changed = solution();
    changed[7].aircraftId = 'AS04';
    const next = evaluate(tutorial, changed);
    assert.equal(original.fuel, next.fuel);
    assert.equal(original.maintenanceReserve, next.maintenanceReserve);
    assert.equal(original.mandatoryMaintenance, next.mandatoryMaintenance);
    assert.equal(original.fuel, evaluate(tutorial, []).fuel);
});
test('필수편을 하나라도 빼면 추가 점수를 받지 않고 클리어할 수 없다', () => {
    const complete = evaluate(tutorial, solution());
    const incomplete = evaluate(tutorial, solution().slice(1));
    assert.ok(incomplete.score < complete.score);
    assert.deepEqual(incomplete.parts.slice(1), [0, 0, 0]);
    assert.equal(incomplete.cleared, false);
});
test('저장과 복원은 버전, 데이터셋, 기체, 중복 배정과 손상을 검증한다', () => {
    const saved = makeSave(tutorial, solution(), 'play-1', false);
    assert.deepEqual(parseSave(JSON.stringify(saved), tutorial), saved);
    assert.throws(() => parseSave('{oops', tutorial), /손상/);
    assert.throws(() => parseSave(JSON.stringify(saved), practice), /버전/);
    assert.throws(() => parseSave(JSON.stringify({ ...saved, version: 99 }), tutorial), /버전/);
    assert.throws(
        () =>
            parseSave(
                JSON.stringify({ ...saved, assignments: [...saved.assignments, saved.assignments[0]] }),
                tutorial,
            ),
        /중복/,
    );
    assert.throws(
        () =>
            parseSave(
                JSON.stringify({ ...saved, assignments: [{ rotationId: 'x', aircraftId: 'AS01' }] }),
                tutorial,
            ),
        /잘못된/,
    );
    assert.throws(() => parseSave(JSON.stringify({ ...saved, repeat: true }), tutorial), /구조/);
});
test('같은 플레이 클리어 재열기와 복원은 중복 기록되지 않으며 마스터만 실무 해금에 반영', () => {
    const first = recordClear(null, 'same-play');
    const reopened = recordClear(JSON.stringify(first), 'same-play');
    assert.equal(reopened.clears.length, 1);
    assert.equal(reopened.masterClears, 0);
    let progress = reopened;
    for (let i = 0; i < 3; i++) progress = recordClear(JSON.stringify(progress), `master-${i}`, 'jinair');
    assert.ok(progress.practicalUnlocked);
    assert.equal(progress.masterClears, 3);
    assert.throws(() => recordClear('broken', 'new'), /손상/);
});
test('검증과 평가가 원본 예정편 및 배정을 변경하지 않는다', () => {
    const before = JSON.stringify(tutorial);
    const values = solution();
    const assignmentsBefore = JSON.stringify(values);
    validate(tutorial, values);
    evaluate(tutorial, values);
    assert.equal(JSON.stringify(tutorial), before);
    assert.equal(JSON.stringify(values), assignmentsBefore);
});

test('가상 주간도 필수 정비와 주간 반복을 유지하면서 클리어할 수 있다', () => {
    const values = practice.rotations.map((r, i) => ({
        rotationId: r.id,
        aircraftId: i === 28 ? 'AS04' : ['AS01', 'AS02', 'AS05', 'AS03'][i % 4],
    }));
    const result = evaluate(practice, values, true);
    assert.deepEqual(result.issues, []);
    assert.ok(result.cleared);
});
