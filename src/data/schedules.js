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
};
export const sources = [
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
export const aircraft = Array.from({ length: 6 }, (_, i) => ({
    id: `AS0${i + 1}`,
    startAirport: i < 4 ? 'ICN' : 'GMP',
    initialHours: [6, 8, 5, 7, 3, 4][i],
    initialCycles: [4, 6, 4, 6, 2, 4][i],
}));
const weekStart = Date.parse('2026-11-16T00:00:00+09:00');
const weekEnd = Date.parse('2026-11-23T00:00:00+09:00');
function flight(id, number, from, to, date, dep, arrivalDate, arr, sourceId) {
    return {
        id,
        number,
        from,
        to,
        departureDate: date,
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
function makeDataset(id, name, kind, rows) {
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
        ] = r;
        const key = `${id}-${i + 1}`;
        flights.push(flight(`${key}-out`, out, base, destination, date, dep, date, arr, sourceOut));
        flights.push(
            flight(
                `${key}-back`,
                back,
                destination,
                base,
                returnDate,
                returnDep,
                returnDate,
                returnArr,
                sourceBack,
            ),
        );
        return {
            id: key,
            outboundId: `${key}-out`,
            inboundId: `${key}-back`,
            turnaroundMinutes: rules.turnaroundMinutes,
            required: true,
            pairingStatus: '공항, 날짜, UTC 순서로 명시적 연결. 실제 기체 연속 운항을 의미하지 않음.',
        };
    });
    const maintenance = aircraft.map((a, i) => ({
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
        aircraft,
        rules,
        maintenance,
        boundaries: aircraft.map((a) => ({
            aircraftId: a.id,
            previous: { airport: a.startAirport, arrival: weekStart - 3600000, ready: weekStart },
            next: { airport: a.startAirport, departure: weekEnd + 12 * 3600000 },
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
export const datasets = [tutorial, practice];
