// 원본 예정편, 명시적 왕복 연결, 기체와 게임 규칙을 각각 보관합니다.
export const airports = {
    ICN: { name: '인천', timeZone: 'Asia/Seoul', offset: '+09:00' },
    GMP: { name: '김포', timeZone: 'Asia/Seoul', offset: '+09:00' },
    CJU: { name: '제주', timeZone: 'Asia/Seoul', offset: '+09:00' },
    KIX: { name: '오사카', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    FUK: { name: '후쿠오카', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    NRT: { name: '도쿄', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    TAK: { name: '다카마쓰', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    YGJ: { name: '요나고', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    CXR: { name: '나트랑', timeZone: 'Asia/Ho_Chi_Minh', offset: '+07:00' },
    LAX: { name: '로스앤젤레스', timeZone: 'America/Los_Angeles', offset: '-08:00' },
    SFO: { name: '샌프란시스코', timeZone: 'America/Los_Angeles', offset: '-08:00' },
    EWR: { name: '뉴욕', timeZone: 'America/New_York', offset: '-05:00' },
    IAD: { name: '워싱턴', timeZone: 'America/New_York', offset: '-05:00' },
    HNL: { name: '호놀룰루', timeZone: 'Pacific/Honolulu', offset: '-10:00' },
    BKK: { name: '방콕', timeZone: 'Asia/Bangkok', offset: '+07:00' },
    HKG: { name: '홍콩', timeZone: 'Asia/Hong_Kong', offset: '+08:00' },
};
export const sources = [
    {
        id: 'weekly-catalog',
        title: '항공사별 주간 운항 편명 데이터',
        sourceUrl: 'https://nowboarding.kr/',
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-20 기준 동계 운항',
        status: '현재 주간 기준',
        note: '에어서울·파라타항공·에어프레미아 편명, 운항 요일과 현지 시각을 항공사 공지 및 공항 운항 자료와 대조했습니다.',
    },
    {
        id: 'trip-list',
        title: 'Trip.com 에어서울 예정편 목록',
        sourceUrl: 'https://kr.trip.com/flights/status/rs/',
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-20',
        status: '보조 출처 확인',
        note: '열린 페이지의 오늘 11월 20일을 확인. 예정 출도착 열만 사용, 실제 착륙 시각과 결항편 제외. 공식 주간 자료 아님.',
    },
    {
        id: 'trip-301',
        title: 'RS301 개별 예정편',
        sourceUrl: 'https://kr.trip.com/flights/status-rs301/',
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-20 ~ 2026-11-21',
        status: '보조 출처 날짜 대조',
        note: '검색 캐시와 열린 페이지 날짜 차이 확인. 본문 2026-11-21 예정 07:15 / 09:05 사용. 과거 기록의 실제 시각 미사용.',
    },
    {
        id: 'trip-302',
        title: 'RS302 개별 예정편',
        sourceUrl: 'https://kr.trip.com/flights/status-rs302/',
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-20 ~ 2026-11-21',
        status: '보조 출처 날짜 대조',
        note: '본문 2026-11-21 예정 10:00 / 11:55 사용. 왕편 도착 KIX 이후 같은 날짜 KIX 출발을 확인해 게임용으로 연결.',
    },
    {
        id: 'renumber',
        title: '에어서울 운항 편명 변경 공지',
        sourceUrl: 'https://flyairseoul.com/CM/ko/noticeContent.do?board_id=notice&seq=11219',
        checkedAt: '2026-11-20',
        appliesTo: '2026-10-25 이후',
        status: '본문 검증 보류',
        note: '공식 공지 목록 검색에 2026-10-21 게시와 적용일 노출. 본문 403으로 신구 편명 매핑은 검증하지 못함. 구편명 변환 추정 없음.',
    },
    {
        id: 'airportal',
        title: '항공정보포털 항공사 스케줄',
        sourceUrl: 'https://www.airportal.go.kr/airline/airplaneSchedule.do',
        checkedAt: '2026-11-20',
        appliesTo: '기준 주간 미확보',
        status: '조회 결과 미확보',
        note: '페이지는 열리지만 항공편 행이 없는 동적 조회 화면. 공식 주간 시간표로 사용하지 않음.',
    },
    {
        id: 'cxr-notice',
        title: '에어서울 나트랑 스케줄 변경 공지',
        sourceUrl: 'https://flyairseoul.com/CM/ko/noticeContent.do?board_id=notice&seq=11224',
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-11 ~ 2026-12-02',
        status: '검색 본문만 확인, 채택 보류',
        note: '검색에 날짜 변경이 노출되지만 직접 본문 접근은 403. 나트랑 실제편은 튜토리얼에 넣지 않음.',
    },
    {
        id: 'fiction',
        title: 'Flight Scheduler 가상 시나리오',
        sourceUrl: null,
        checkedAt: '2026-11-20',
        appliesTo: '2026-11-16 ~ 2026-11-23',
        status: '가상 연습 데이터',
        note: '모든 FS 편명과 시간은 게임 전용 창작. 실제 운항 자료와 분리.',
    },
];
export const rules = {
    turnaroundMinutes: 45,
    destinationMinimumMinutes: 30,
    reserveMinutes: 30,
    maxHours: 62,
    maxCycles: 30,
    fuelPerHour: 420,
    reservePerHour: 110,
    reservePerCycle: 70,
    activationCost: 120,
    maintenanceCost: 180,
};
const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
export const aircraft = Array.from({ length: 6 }, (_, i) => ({
    id: `AS0${i + 1}`,
    startAirport: i < 4 ? 'ICN' : 'GMP',
    initialHours: [6, 8, 5, 7, 3, 4][i],
    initialCycles: [4, 6, 4, 6, 2, 4][i],
}));
const weekStart = Date.parse('2026-11-16T00:00:00+09:00');
const weekEnd = Date.parse('2026-11-23T00:00:00+09:00');
function flight(id, number, from, to, date, dep, arrivalDate, arr, sourceId) {
    const weekday = weekdayNames[new Date(`${date}T12:00:00+09:00`).getDay()];
    return {
        id,
        number,
        from,
        to,
        departureDate: date,
        weekday,
        departureLocal: dep,
        arrivalDate,
        arrivalLocal: arr,
        departureTimeZone: airports[from].timeZone,
        arrivalTimeZone: airports[to].timeZone,
        scheduledDeparture: `${date}T${dep}:00${airports[from].offset}`,
        scheduledArrival: `${arrivalDate}T${arr}:00${airports[to].offset}`,
        timeType: 'scheduled',
        sourceId,
    };
}
function makeDataset(id, name, kind, rows, options = {}) {
    const scenarioAircraft = options.aircraft || aircraft;
    const scenarioRules = options.rules || rules;
    const flights = [];
    const rotations = rows.map((r, i) => {
        const [
            date,
            base,
            destination,
            out,
            back,
            dep,
            arr,
            returnDate,
            returnDep,
            returnArr,
            sourceOut = 'trip-list',
            sourceBack = sourceOut,
            outboundArrivalDate = date,
            inboundArrivalDate = returnDate,
        ] = r;
        const key = `${id}-${i + 1}`;
        flights.push(
            flight(`${key}-out`, out, base, destination, date, dep, outboundArrivalDate, arr, sourceOut),
        );
        flights.push(
            flight(
                `${key}-back`,
                back,
                destination,
                base,
                returnDate,
                returnDep,
                inboundArrivalDate,
                returnArr,
                sourceBack,
            ),
        );
        return {
            id: key,
            outboundId: `${key}-out`,
            inboundId: `${key}-back`,
            turnaroundMinutes: scenarioRules.turnaroundMinutes,
            required: true,
            pairingStatus: '공항, 날짜, UTC 순서로 명시적 연결. 실제 기체 연속 운항을 의미하지 않음.',
        };
    });
    const maintenance =
        options.maintenance === false
            ? []
            : scenarioAircraft.map((a, i) => ({
                  id: `maintenance-${a.id}`,
                  aircraftId: a.id,
                  airport: a.startAirport,
                  start: Date.parse(`2026-11-18T${String(2 + i).padStart(2, '0')}:00:00+09:00`),
                  end: Date.parse(`2026-11-18T${String(4 + i).padStart(2, '0')}:00:00+09:00`),
                  required: true,
              }));
    return {
        id,
        name,
        kind,
        weekStart,
        weekEnd,
        flights,
        rotations,
        aircraft: scenarioAircraft,
        rules: scenarioRules,
        maintenance,
        airlineName: options.airlineName || '에어서울',
        airlineCode: options.airlineCode || 'RS',
        difficulty: options.difficulty || '하 난이도',
        description: options.description || '',
        boundaries: scenarioAircraft.map((a) => ({
            aircraftId: a.id,
            previous: { airport: a.startAirport, arrival: weekStart - 3600000, ready: weekStart },
            next: {
                airport: a.startAirport,
                departure: weekEnd + (options.boundaryHours || 12) * 3600000,
            },
        })),
    };
}
export const tutorial = makeDataset('airseoul-partial-20261120-v1', '부분 시간표 튜토리얼', 'partial', [
    ['2026-11-20', 'ICN', 'KIX', 'RS301', 'RS302', '07:15', '09:05', '2026-11-20', '10:00', '11:55'],
    ['2026-11-20', 'ICN', 'FUK', 'RS433', 'RS434', '08:10', '09:30', '2026-11-20', '10:30', '12:05'],
    ['2026-11-20', 'ICN', 'NRT', 'RS247', 'RS248', '08:10', '10:25', '2026-11-20', '11:25', '14:05'],
    ['2026-11-20', 'ICN', 'TAK', 'RS297', 'RS298', '08:45', '10:30', '2026-11-20', '11:40', '13:20'],
    ['2026-11-20', 'GMP', 'CJU', 'RS6347', 'RS6306', '06:00', '07:15', '2026-11-20', '08:05', '09:20'],
    ['2026-11-20', 'GMP', 'CJU', 'RS6407', 'RS6408', '09:55', '11:15', '2026-11-20', '11:45', '13:00'],
    ['2026-11-20', 'ICN', 'YGJ', 'RS471', 'RS472', '13:20', '14:50', '2026-11-20', '15:50', '17:40'],
    [
        '2026-11-21',
        'ICN',
        'KIX',
        'RS301',
        'RS302',
        '07:15',
        '09:05',
        '2026-11-21',
        '10:00',
        '11:55',
        'trip-301',
        'trip-302',
    ],
]);
const premiaAircraft = Array.from({ length: 9 }, (_, i) => ({
    id: `AP${String(i + 1).padStart(2, '0')}`,
    startAirport: 'ICN',
    initialHours: [8, 5, 7, 6, 9, 4, 8, 5, 7][i],
    initialCycles: [2, 2, 4, 2, 4, 2, 2, 4, 2][i],
}));
const premiaRules = {
    ...rules,
    turnaroundMinutes: 60,
    destinationMinimumMinutes: 60,
    reserveMinutes: 60,
    maxHours: 110,
    maxCycles: 28,
    fuelPerHour: 780,
    reservePerHour: 190,
    activationCost: 220,
    maintenanceCost: 300,
};
const dateAt = (dayIndex, offset = 0) =>
    new Date(Date.UTC(2026, 10, 16 + dayIndex + offset)).toISOString().slice(0, 10);
const premiaRows = [];
function addPremiaRotation(day, config, returnOffset = 0) {
    const departureDate = dateAt(day);
    const returnDate = dateAt(day, returnOffset);
    premiaRows.push([
        departureDate,
        'ICN',
        config.destination,
        config.out,
        config.back,
        config.outDep,
        config.outArr,
        returnDate,
        config.backDep,
        config.backArr,
        'weekly-catalog',
        'weekly-catalog',
        dateAt(day, config.outArrivalOffset || 0),
        dateAt(day, returnOffset + (config.backArrivalOffset || 0)),
    ]);
}
const premiaRoutes = {
    nrt1: {
        destination: 'NRT',
        out: 'YP731',
        back: 'YP732',
        outDep: '08:45',
        outArr: '11:20',
        backDep: '12:30',
        backArr: '15:20',
    },
    nrt2: {
        destination: 'NRT',
        out: 'YP735',
        back: 'YP736',
        outDep: '13:55',
        outArr: '16:30',
        backDep: '17:40',
        backArr: '20:25',
    },
    lax1: {
        destination: 'LAX',
        out: 'YP101',
        back: 'YP102',
        outDep: '13:20',
        outArr: '07:20',
        backDep: '09:50',
        backArr: '16:20',
        backArrivalOffset: 1,
    },
    lax2: {
        destination: 'LAX',
        out: 'YP103',
        back: 'YP104',
        outDep: '22:20',
        outArr: '16:20',
        backDep: '09:50',
        backArr: '16:20',
        backArrivalOffset: 1,
    },
    sfo: {
        destination: 'SFO',
        out: 'YP111',
        back: 'YP112',
        outDep: '19:45',
        outArr: '13:20',
        backDep: '15:20',
        backArr: '21:20',
        backArrivalOffset: 1,
    },
    ewr: {
        destination: 'EWR',
        out: 'YP131',
        back: 'YP132',
        outDep: '21:40',
        outArr: '21:15',
        backDep: '23:15',
        backArr: '04:55',
        backArrivalOffset: 2,
    },
    iad: {
        destination: 'IAD',
        out: 'YP135',
        back: 'YP136',
        outDep: '21:05',
        outArr: '20:35',
        backDep: '23:35',
        backArr: '05:25',
        backArrivalOffset: 2,
    },
    hnl: {
        destination: 'HNL',
        out: 'YP151',
        back: 'YP152',
        outDep: '22:50',
        outArr: '11:50',
        backDep: '14:20',
        backArr: '20:10',
        backArrivalOffset: 1,
    },
    bkk: {
        destination: 'BKK',
        out: 'YP601',
        back: 'YP602',
        outDep: '17:15',
        outArr: '21:25',
        backDep: '22:55',
        backArr: '06:35',
        backArrivalOffset: 1,
    },
    hkg: {
        destination: 'HKG',
        out: 'YP801',
        back: 'YP802',
        outDep: '09:15',
        outArr: '12:05',
        backDep: '13:40',
        backArr: '18:20',
    },
};
[0, 1, 2, 3, 4, 5, 6].forEach((day) => {
    addPremiaRotation(day, premiaRoutes.nrt1);
    addPremiaRotation(day, premiaRoutes.lax1);
});
[4, 5, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.nrt2));
addPremiaRotation(2, premiaRoutes.lax2, 1);
addPremiaRotation(4, premiaRoutes.lax2, 2);
[[2, 1], [4, 1], [5, 1], [6, 1]].forEach(([day, offset]) =>
    addPremiaRotation(day, premiaRoutes.sfo, offset),
);
[1, 2, 3, 4, 5, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.ewr));
[0, 2, 4].forEach((day) => addPremiaRotation(day, premiaRoutes.iad));
[2, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.hnl));
[0, 3, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.bkk));
[0, 1, 2, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.hkg));
export const airPremia = makeDataset(
    'airpremia-weekly-20261120-v1',
    '에어프레미아 주간 운항',
    'weekly',
    premiaRows,
    {
        aircraft: premiaAircraft,
        rules: premiaRules,
        airlineName: '에어프레미아',
        airlineCode: 'YP',
        difficulty: '최하 난이도',
        description: '2026.11.20 기준 중·장거리 주간 운항',
        boundaryHours: 72,
        maintenance: false,
    },
);
const practiceRows = [];
for (let day = 16; day <= 22; day++) {
    const date = `2026-11-${day}`;
    [
        ['ICN', 'KIX', '07:15', '09:05', '10:00', '11:55'],
        ['ICN', 'NRT', '08:10', '10:25', '11:25', '14:05'],
        ['GMP', 'CJU', '09:55', '11:15', '12:00', '13:15'],
        ['ICN', 'FUK', '15:00', '16:30', '17:20', '18:55'],
    ].forEach((r, i) => {
        practiceRows.push([
            date,
            r[0],
            r[1],
            `FS${day}${i}1`,
            `FS${day}${i}2`,
            r[2],
            r[3],
            date,
            r[4],
            r[5],
            'fiction',
        ]);
    });
}
practiceRows.push([
    '2026-11-22',
    'ICN',
    'CXR',
    'FS901',
    'FS902',
    '20:00',
    '23:30',
    '2026-11-23',
    '00:30',
    '07:25',
    'fiction',
]);
export const practice = makeDataset(
    'airseoul-fiction-20261116-v1',
    '가상 주간 연습',
    'fiction',
    practiceRows,
);
export const datasets = [tutorial, airPremia, practice];
