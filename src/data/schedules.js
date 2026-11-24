import networkAirports from './network-airports.json' with { type: 'json' };

// 원본 예정편, 명시적 왕복 연결, 기체와 게임 규칙을 각각 보관합니다.
export const airports = {
    ...networkAirports,
    PUS: { name: '부산', timeZone: 'Asia/Seoul', offset: '+09:00' },
    CTS: { name: '삿포로', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    YNY: { name: '양양', timeZone: 'Asia/Seoul', offset: '+09:00' },
    HAN: { name: '하노이', timeZone: 'Asia/Ho_Chi_Minh', offset: '+07:00' },
    SZX: { name: '선전', timeZone: 'Asia/Shanghai', offset: '+08:00' },
    ICN: { name: '인천', timeZone: 'Asia/Seoul', offset: '+09:00' },
    GMP: { name: '김포', timeZone: 'Asia/Seoul', offset: '+09:00' },
    CJU: { name: '제주', timeZone: 'Asia/Seoul', offset: '+09:00' },
    KIX: { name: '오사카', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    FUK: { name: '후쿠오카', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    NRT: { name: '도쿄', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    TAK: { name: '다카마쓰', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    YGJ: { name: '요나고', timeZone: 'Asia/Tokyo', offset: '+09:00' },
    DYG: { name: '장가계', timeZone: 'Asia/Shanghai', offset: '+08:00' },
    DAD: { name: '다낭', timeZone: 'Asia/Ho_Chi_Minh', offset: '+07:00' },
    CXR: { name: '나트랑', timeZone: 'Asia/Ho_Chi_Minh', offset: '+07:00' },
    GUM: { name: '괌', timeZone: 'Pacific/Guam', offset: '+10:00' },
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
        id: 'network-week', title: '11월 16일~22일 정기편의 현지 예정 시각',
        sourceUrl: 'https://www.flightradar24.com/data/flights', checkedAt: '2026-11-23',
        appliesTo: '2026-11-16 ~ 2026-11-22', status: '편명별 기준 주간 자료',
        note: '운항 편명 화면에서 자료를 확인할 수 있습니다. 출도착 시각이 확인된 반대 방향 편을 게임용 왕복으로 연결합니다.',
    },
    {
        id: 'fuk-november', title: '후쿠오카공항 2026년 11월 국제선 정기 시간표',
        sourceUrl: 'https://www.fukuoka-airport.jp/assets/flight/schedule/doc/11/202611_timetable_int.pdf',
        checkedAt: '2026-11-23', appliesTo: '2026-10-25 ~ 2026-11-30', status: '공항 공식 시간표',
        note: '11월 16일부터 22일까지 적용되는 운항 요일과 현지 예정 시각',
    },
    {
        id: 'busan-w26', title: '에어부산 동계 정기 시간표',
        sourceUrl: 'https://www.airbusan.com/web/individual/booking/schedule',
        checkedAt: '2026-11-23', appliesTo: '2026-11-16 ~ 2026-11-22',
        status: '주요 3개 노선', note: '예정 시각 기준. 일시 비운항 편도 정기 운항일에 포함합니다.',
    },
    {
        id: 'airseoul-icn-20261122',
        title: '인천공항 2026.11.22 에어서울 출발편',
        sourceUrl: 'https://nowboarding.kr/airport/icn/departures',
        checkedAt: '2026-11-22',
        appliesTo: '2026-11-22 인천 출발 16편',
        status: '공항 운항 자료 대조 완료',
        note: '인천공항 실시간 운항 자료에서 편명, 목적지와 예정 출발 시각을 전편 대조했습니다.',
    },
    {
        id: 'airseoul-gmp-20261122',
        title: '김포공항 2026.11.22 에어서울 출발편',
        sourceUrl: 'https://nowboarding.kr/airport/gmp/departures',
        checkedAt: '2026-11-22',
        appliesTo: '2026-11-22 김포 출발 4편',
        status: '공항 운항 자료 대조 완료',
        note: '한국공항공사 기반 실시간 운항 자료에서 김포-제주 4편의 편명과 예정 시각을 대조했습니다.',
    },
    {
        id: 'airseoul-live-20261122',
        title: '에어서울 2026.11.22 전체 예정편',
        sourceUrl: 'https://kr.trip.com/flights/status/rs/',
        checkedAt: '2026-11-22',
        appliesTo: '2026-11-22 출도착 및 익일 귀국편',
        status: '36편 운항 목록 대조 완료',
        note: '당일 예정편 목록과 개별 편 상태에서 출도착 공항 및 현지 예정 시각을 교차 확인했습니다. 실제 지연 시각은 사용하지 않았습니다.',
    },
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
        checkedAt: '2026-11-22',
        appliesTo: '2026-10-25 이후',
        status: '공식 공지 확인 완료',
        note: '2026.10.25 이후 적용되는 전 노선 신편명과 왕복 편명 쌍을 공식 공지에서 확인했습니다.',
    },
    {
        id: 'airseoul-fleet-20260930',
        title: '에어서울 항공기 등록 정보',
        sourceUrl: 'https://flyairseoul.com/CW/ko/safe_infor.do',
        checkedAt: '2026-11-22',
        appliesTo: 'HL8072·HL8073·HL8255·HL7790·HL7212·HL7789',
        status: '공식 등록 정보 확인 완료',
        note: '2026.09.30 기준 현행 A321-200 6대를 확인했습니다. HL8281은 전체 운항 시나리오에 필요한 추가 슬롯으로, 에어서울에서 실제 운항했던 등록기호입니다.',
    },
    {
        id: 'airpremia-fleet-20261122',
        title: '에어프레미아 항공기 등록 정보',
        sourceUrl: 'https://b787register.co.uk/operator.php?operator=Air+Premia',
        checkedAt: '2026-11-22',
        appliesTo: '에어프레미아 B787-9 9대',
        status: '현행 등록 정보 대조 완료',
        note: '현행 B787-9 9대의 등록기호와 운항 상태를 대조했습니다.',
    },
    {
        id: 'airpremia-icn-20261122',
        title: '인천공항 2026.11.22 에어프레미아 출발편',
        sourceUrl: 'https://nowboarding.kr/airport/icn/departures',
        checkedAt: '2026-11-22',
        appliesTo: '2026-11-22 인천 출발 운항편',
        status: '공항 운항 자료 대조 완료',
        note: 'YP103 일요일 운항을 포함해 11월 22일 편명, 목적지와 예정 출발 시각을 대조했습니다. 일정 변경된 YP135는 당일 운항에서 제외했습니다.',
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
    const maintenance = [];
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
const airSeoulNovember22Rows = [
    ['2026-11-22', 'GMP', 'CJU', 'RS6347', 'RS6306', '06:00', '07:15', '2026-11-22', '08:05', '09:20', 'airseoul-gmp-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'KIX', 'RS301', 'RS302', '07:15', '09:05', '2026-11-22', '10:00', '11:55', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'NRT', 'RS247', 'RS248', '08:10', '10:25', '2026-11-22', '11:25', '14:05', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'FUK', 'RS433', 'RS434', '08:10', '09:30', '2026-11-22', '10:30', '12:05', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'TAK', 'RS297', 'RS298', '08:45', '10:30', '2026-11-22', '11:40', '13:20', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'NRT', 'RS259', 'RS260', '09:20', '11:50', '2026-11-22', '12:50', '15:35', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'GMP', 'CJU', 'RS6407', 'RS6408', '09:55', '11:15', '2026-11-22', '11:45', '13:00', 'airseoul-gmp-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'DYG', 'RS861', 'RS862', '12:20', '15:00', '2026-11-22', '16:00', '19:55', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'KIX', 'RS353', 'RS354', '13:10', '15:00', '2026-11-22', '16:00', '17:55', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'YGJ', 'RS471', 'RS472', '13:20', '14:50', '2026-11-22', '15:50', '17:40', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'GMP', 'CJU', 'RS6419', 'RS6356', '13:40', '14:55', '2026-11-22', '16:05', '17:20', 'airseoul-gmp-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'FUK', 'RS457', 'RS458', '14:25', '15:55', '2026-11-22', '17:00', '18:35', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'KIX', 'RS381', 'RS382', '15:20', '17:00', '2026-11-22', '18:00', '20:05', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'NRT', 'RS267', 'RS268', '16:40', '19:00', '2026-11-22', '20:00', '22:30', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'GMP', 'CJU', 'RS6439', 'RS6502', '18:40', '19:55', '2026-11-22', '20:40', '21:55', 'airseoul-gmp-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'KIX', 'RS379', 'RS380', '18:50', '20:40', '2026-11-22', '21:40', '23:30', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'GUM', 'RS913', 'RS914', '19:25', '01:00', '2026-11-23', '02:00', '05:50', 'airseoul-icn-20261122', 'airseoul-live-20261122', '2026-11-23', '2026-11-23'],
    ['2026-11-22', 'ICN', 'CXR', 'RS115', 'RS116', '20:00', '23:30', '2026-11-23', '00:30', '07:25', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'DAD', 'RS095', 'RS096', '20:55', '23:40', '2026-11-23', '00:40', '07:15', 'airseoul-icn-20261122', 'airseoul-live-20261122'],
    ['2026-11-22', 'ICN', 'GUM', 'RS905', 'RS906', '20:55', '02:30', '2026-11-23', '03:30', '07:20', 'airseoul-icn-20261122', 'airseoul-live-20261122', '2026-11-23', '2026-11-23'],
];
const airSeoulDateAt = (dayIndex, offset = 0) =>
    new Date(Date.UTC(2026, 10, 16 + dayIndex + offset)).toISOString().slice(0, 10);
const mondayToSaturday = [0, 1, 2, 3, 4, 5];
const airSeoulWeeklyRoutes = [
    ['GMP', 'CJU', 'RS6347', 'RS6306', '06:00', '07:15', '08:05', '09:20', mondayToSaturday],
    ['ICN', 'KIX', 'RS301', 'RS302', '07:15', '09:05', '10:00', '11:55', mondayToSaturday],
    ['ICN', 'NRT', 'RS247', 'RS248', '08:10', '10:25', '11:25', '14:05', mondayToSaturday],
    ['ICN', 'FUK', 'RS433', 'RS434', '08:10', '09:30', '10:30', '12:05', mondayToSaturday],
    ['ICN', 'TAK', 'RS297', 'RS298', '08:45', '10:30', '11:40', '13:20', mondayToSaturday],
    ['ICN', 'NRT', 'RS259', 'RS260', '09:20', '11:50', '12:50', '15:35', mondayToSaturday],
    ['GMP', 'CJU', 'RS6407', 'RS6408', '09:55', '11:15', '11:45', '13:00', mondayToSaturday],
    ['ICN', 'DYG', 'RS861', 'RS862', '12:20', '15:00', '16:00', '19:55', [1, 3, 5]],
    ['ICN', 'KIX', 'RS353', 'RS354', '13:10', '15:00', '16:00', '17:55', [0, 1, 2, 4, 5]],
    ['ICN', 'YGJ', 'RS471', 'RS472', '13:20', '14:50', '15:50', '17:40', [0, 2, 3, 4]],
    ['GMP', 'CJU', 'RS6419', 'RS6356', '13:40', '14:55', '16:05', '17:20', mondayToSaturday],
    ['ICN', 'FUK', 'RS457', 'RS458', '14:25', '15:55', '17:00', '18:35', mondayToSaturday],
    ['ICN', 'KIX', 'RS381', 'RS382', '15:20', '17:00', '18:00', '20:05', mondayToSaturday],
    ['ICN', 'NRT', 'RS267', 'RS268', '16:40', '19:00', '20:00', '22:30', mondayToSaturday],
    ['GMP', 'CJU', 'RS6439', 'RS6502', '18:40', '19:55', '20:40', '21:55', mondayToSaturday],
    ['ICN', 'KIX', 'RS379', 'RS380', '18:50', '20:40', '21:40', '23:30', [2, 4]],
    ['ICN', 'GUM', 'RS913', 'RS914', '19:25', '01:00', '02:00', '05:50', mondayToSaturday, true],
    ['ICN', 'CXR', 'RS115', 'RS116', '20:00', '23:30', '00:30', '07:25', [1, 4], true, false],
    ['ICN', 'DAD', 'RS095', 'RS096', '20:55', '23:40', '00:40', '07:15', [2, 3, 5], true, false],
    ['ICN', 'GUM', 'RS905', 'RS906', '20:55', '02:30', '03:30', '07:20', [0, 1, 2, 3, 4], true],
];
const airSeoulWeeklyRows = [
    ...airSeoulWeeklyRoutes.flatMap(
        ([
            base,
            destination,
            out,
            back,
            dep,
            arr,
            returnDep,
            returnArr,
            days,
            returnNextDay = false,
            outboundArrivesNextDay = returnNextDay,
        ]) =>
            days.map((day) => {
                const departureDate = airSeoulDateAt(day);
                const returnDate = airSeoulDateAt(day, returnNextDay ? 1 : 0);
                const outboundArrivalDate = airSeoulDateAt(day, outboundArrivesNextDay ? 1 : 0);
                return [
                    departureDate,
                    base,
                    destination,
                    out,
                    back,
                    dep,
                    arr,
                    returnDate,
                    returnDep,
                    returnArr,
                    'weekly-catalog',
                    'weekly-catalog',
                    outboundArrivalDate,
                    returnDate,
                ];
            }),
    ),
    ...airSeoulNovember22Rows,
];
const airSeoulFullRules = {
    ...rules,
    turnaroundMinutes: 30,
    maxHours: 140,
    maxCycles: 60,
};
const airSeoulFullRegistrations = ['HL8072', 'HL8073', 'HL8255', 'HL7790', 'HL7212', 'HL7789', 'HL8281'];
const airSeoulFullAircraft = airSeoulFullRegistrations.map((id) => ({
    id,
    startAirport: 'ICN',
    initialHours: 0,
    initialCycles: 0,
}));
export const airSeoulFull = makeDataset(
    'airseoul-weekly-20261122-v2',
    '에어서울 주간 운항',
    'weekly',
    airSeoulWeeklyRows,
    {
        aircraft: airSeoulFullAircraft,
        rules: airSeoulFullRules,
        difficulty: '하 난이도',
        description: '2026.11.16~22 편명별 운항 요일을 반영한 주간 운항',
    },
);
const premiaRegistrations = [
    'HL8701',
    'HL8702',
    'HL8703',
    'HL8704',
    'HL8517',
    'HL8516',
    'HL8387',
    'HL8388',
    'HL8389',
];
const premiaAircraft = premiaRegistrations.map((id, i) => ({
    id,
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
addPremiaRotation(6, premiaRoutes.lax2, 2);
[[2, 1], [4, 1], [5, 1], [6, 1]].forEach(([day, offset]) =>
    addPremiaRotation(day, premiaRoutes.sfo, offset),
);
[1, 2, 3, 4, 5, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.ewr));
[0, 2, 4].forEach((day) => addPremiaRotation(day, premiaRoutes.iad));
[2, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.hnl));
[0, 3, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.bkk));
[0, 1, 2, 4, 6].forEach((day) => addPremiaRotation(day, premiaRoutes.hkg));
export const airPremia = makeDataset(
    'airpremia-weekly-20261122-v2',
    '에어프레미아 주간 운항',
    'weekly',
    premiaRows,
    {
        aircraft: premiaAircraft,
        rules: premiaRules,
        airlineName: '에어프레미아',
        airlineCode: 'YP',
        difficulty: '최하 난이도',
        description: '2026.11.22 재검증 중·장거리 주간 운항',
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
const passengerFleets = {
    BX: [['A320-200', 5], ['A321-200', 8], ['A321neo', 8]],
    LJ: [['B737-800', 19], ['B737-900', 3], ['B737-8', 7], ['B777-200', 3], ['A321-200', 1]],
    OZ: [['A380-800', 6], ['A350-900', 15], ['B777-200ER', 8], ['A330-300', 14], ['A321neo', 13], ['A321-200', 10]],
    KE: [['A380-800', 5], ['B747-8i', 4], ['B777-300/300ER', 29], ['B787-9/10', 32], ['A330-300', 17],
        ['B737 계열', 23], ['A321neo', 20], ['A220-300', 10], ['A350-900', 3]],
};
function networkRotations(schedules, minimumTurnaround) {
    const byRoute = new Map();
    const ordered = [];
    const weekdays = '월화수목금토일';
    const date = (day) => new Date(Date.UTC(2026, 10, 16 + day)).toISOString().slice(0, 10);
    for (const row of schedules) {
        if (!row.departure_time_local || !row.arrival_time_local || row.arrivalOffset == null) continue;
        const from = row.origin_code;
        const to = row.destination_code;
        for (const weekday of row.days) {
            const day = weekdays.indexOf(weekday);
            const depDate = date(day);
            const arrDate = date(day + row.arrivalOffset);
            const dep = Date.parse(depDate + 'T' + row.departure_time_local + airports[from].offset);
            const arr = Date.parse(arrDate + 'T' + row.arrival_time_local + airports[to].offset);
            if (!(arr > dep && dep >= weekStart)) continue;
            const leg = { row, from, to, depDate, arrDate, dep, arr };
            const key = from + '-' + to;
            if (!byRoute.has(key)) byRoute.set(key, []);
            byRoute.get(key).push(leg);
            ordered.push(leg);
        }
    }
    ordered.sort((a, b) => a.dep - b.dep);
    for (const list of byRoute.values()) list.sort((a, b) => a.dep - b.dep);
    const used = new Set();
    const pairs = [];
    const domesticBases = ['ICN', 'PUS', 'GMP', 'CJU'];
    for (const back of ordered) {
        if (airports[back.to].timeZone !== 'Asia/Seoul') continue;
        if (airports[back.from].timeZone === 'Asia/Seoul') {
            const bases = [...domesticBases, ...[back.to, back.from].sort()];
            if (bases.indexOf(back.to) > bases.indexOf(back.from)) continue;
        }
        // Match a return to the most recently arrived available outbound at that airport.
        const out = byRoute.get(back.to + '-' + back.from)?.findLast((leg) =>
            !used.has(leg) && leg.arr + minimumTurnaround * 60000 <= back.dep &&
            back.dep <= leg.arr + 24 * 3600000);
        if (!out) continue;
        used.add(out);
        used.add(back);
        pairs.push([
            out.depDate, out.from, out.to, out.row.flight_number, back.row.flight_number,
            out.row.departure_time_local, out.row.arrival_time_local, back.depDate,
            back.row.departure_time_local, back.row.arrival_time_local, 'network-week',
            'network-week', out.arrDate, back.arrDate,
        ]);
    }
    return pairs;
}

export function makeWeeklyDataset(schedules, code, networkSchedules = []) {
    const parata = code === 'WE';
    const metadata = {
        WE: ['파라타항공', '최하', 'parata-weekly-20261122-v1'],
        BX: ['에어부산', '중', 'airbusan-weekly-20261122-v3'],
        LJ: ['진에어', '상', 'jinair-weekly-20261122-v2'],
        OZ: ['아시아나항공', '실무', 'asiana-weekly-20261122-v2'],
        KE: ['대한항공', '마스터', 'koreanair-weekly-20261122-v2'],
    };
    const [airlineName, difficulty, id] = metadata[code];
    const parataPairs = {501:502, 503:504, 511:512, 513:514, 531:532, 201:202,
        205:206, 271:272, 853:854, 6501:6502, 6503:6504, 6702:6701, 6704:6703};
    const date = (offset) => new Date(Date.UTC(2026, 10, 16 + offset)).toISOString().slice(0, 10);
    const rows = [];
    for (const [day, weekday] of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].entries()) {
        for (const out of schedules) {
            if (out[weekday] !== '1') continue;
            const outNumber = Number(out.flight_number.slice(2));
            const returnNumber = parata && parataPairs[outNumber] ? code + parataPairs[outNumber] : out.return_flight;
            if (!returnNumber) continue;
            const [arrival, arrivalOffset = 0] = out.arrival_time_local.split('+');
            const returnWeekday = ['mon','tue','wed','thu','fri','sat','sun'][(day + Number(arrivalOffset)) % 7];
            const back = schedules.find((row) => row.flight_number === returnNumber && row[returnWeekday] === '1');
            const source = parata ? 'weekly-catalog' : out.destination_code === 'FUK' ? 'fuk-november' : 'busan-w26';
            const [returnArrival, returnOffset = 0] = back.arrival_time_local.split('+');
            const returnDay = day + Number(arrivalOffset);
            rows.push([
                date(day), out.origin_code, out.destination_code, out.flight_number, back.flight_number,
                parata && outNumber === 201 && day === 0 ? '19:05' : out.departure_time_local, arrival,
                date(returnDay), back.departure_time_local, returnArrival, source,
                source, date(returnDay), date(returnDay + Number(returnOffset)),
            ]);
        }
    }
    rows.push(...networkRotations(networkSchedules, rules.destinationMinimumMinutes));
    const bases = parata ? ['ICN', 'ICN', 'ICN', 'ICN', 'ICN', 'ICN', 'GMP', 'CJU'] : [];
    const models = parata ? bases.map(() => null) : passengerFleets[code].flatMap(([model, count]) => Array(count).fill(model));
    return makeDataset(id, airlineName + ' 주간 운항', 'weekly', rows, {
        airlineName, airlineCode: code, difficulty: difficulty + ' 난이도',
        aircraft: models.map((model, i) => ({
            id: parata ? 'WE0' + (i + 1) : code + '-' + String(i + 1).padStart(3, '0'),
            model, startAirport: bases[i] || (code === 'BX' && i % 2 === 0 ? 'PUS' : 'ICN'),
            initialHours: 0, initialCycles: 0,
        })),
        rules: { ...airSeoulFullRules }, boundaryHours: parata ? 24 : 48,
        description: '11월 16일~22일 출발 왕복편 / 동계 기본 시간표 기준',
    });
}
export const datasets = [airPremia, airSeoulFull, practice];

// Expand by the departure airport's local service date, including overseas starts.
export function makeLegScenario(base, airline) {
    const records = new Map();
    const date = (day) => new Date(Date.UTC(2026, 10, 16 + day)).toISOString().slice(0, 10);
    function put(f) {
        const id = [f.departureDate, f.number, f.from, f.to].join('-');
        records.set(id, { ...f, id });
    }
    const weekdays = ['mon','tue','wed','thu','fri','sat','sun'];
    for (const row of [...airline.networkSchedules, ...airline.schedules]) {
        for (const [day, key] of weekdays.entries()) {
            if (!(row.days ? row.days.includes('월화수목금토일'[day]) : row[key] === '1')) continue;
            const [arrival, suffix] = row.arrival_time_local.split('+');
            const offset = row.days ? row.arrivalOffset : Number(suffix || 0);
            const f = flight('', row.flight_number, row.origin_code, row.destination_code, date(day),
                row.departure_time_local, date(day + (offset || 0)), arrival, row.sources?.join(', ') || 'weekly-catalog');
            if (offset == null) f.scheduledArrival = null;
            put(f);
        }
    }
    for (const f of base.flights) {
        if (f.departureDate < date(0) || f.departureDate > date(6)) continue;
        const key = [f.departureDate, f.number, f.from, f.to].join('-');
        const existing = records.get(key);
        if (!existing || f.sourceId.includes('20261122')) put(f);
    }
    const flights = [], pending = [];
    for (const f of records.values()) {
        if (Date.parse(f.scheduledArrival) > Date.parse(f.scheduledDeparture)) flights.push(f);
        else pending.push(f);
    }
    flights.sort((a, b) => Date.parse(a.scheduledDeparture) - Date.parse(b.scheduledDeparture));
    return { ...base, airportLocations: networkAirports, id: base.id + '-legs', description: '11월 16일~22일 현지 출발 정기편', flights, pending,
        rotations: flights.map((f) => ({ id: f.id, outboundId: f.id, required: true,
            turnaroundMinutes: base.rules.destinationMinimumMinutes })) };
}
