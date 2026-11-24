import routeCsv from './network-routes-202611.csv?raw';
import weekCsv from './network-week-20261122.csv?raw';
import airports from './network-airports.json' with { type: 'json' };

export const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function rows(csv) {
    return csv.trim().split('\n').slice(1).map((line) => line.split(','));
}

const networkRoutes = rows(routeCsv);
const scheduleRows = rows(weekCsv);

export function getNetworkSchedules(code) {
    return scheduleRows.filter(([number]) => number.startsWith(code)).map(
        ([number, from, to, days, departure, arrival, offset, complete, sources]) => ({
            flight_number: number,
            origin_code: from,
            destination_code: to,
            origin_name: airports[from].name,
            destination_name: airports[to].name,
            departure_time_local: departure,
            arrival_time_local: arrival,
            arrivalOffset: offset === '' ? null : Number(offset),
            days,
            complete: complete === '1',
            sources: sources.split('+'),
        }),
    );
}

export function getRouteCatalog(airline) {
    const routes = new Map();
    function getRoute(from, to) {
        const key = from + '-' + to;
        if (!routes.has(key)) {
            routes.set(key, {
                key, from, to, flights: [], days: new Set(),
                origin: airports[from]?.name || from, destination: airports[to]?.name || to,
            });
        }
        return routes.get(key);
    }
    for (const [code, from, to] of networkRoutes) {
        if (code === airline.code) getRoute(from, to);
    }
    for (const flight of [...airline.schedules, ...airline.networkSchedules]) {
        const route = getRoute(flight.origin_code, flight.destination_code);
        const days = flight.days || weekdays.filter((day, index) => flight[dayKeys[index]] === '1').join('');
        for (const day of days) route.days.add(day);
        route.flights.push({ ...flight, days });
    }
    for (const route of routes.values()) {
        const days = weekdays.filter((day) => route.days.has(day));
        route.pattern = days.length === 7 ? '매일' : days.length
            ? '확인된 운항일 ' + dayLabel(days)
            : '기준 주간 요일 미확인';
    }
    return [...routes.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function dayLabel(days) {
    return days.length === 7 ? '매일' : '주 ' + days.length + '일 (' + [...days].join(', ') + ')';
}
