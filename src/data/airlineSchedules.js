import airSeoulCsv from './airseoul-weekly-schedules.csv?raw';
import parataCsv from './parata-weekly-schedules.csv?raw';
import airPremiaCsv from './airpremia-weekly-schedules.csv?raw';

function parseCsv(csv) {
    const [header, ...lines] = csv.trim().split('\n');
    const keys = header.split(',');
    return lines.map((line) =>
        Object.fromEntries(line.split(',').map((value, index) => [keys[index], value])),
    );
}

export const airlineSchedules = [
    { id: 'airseoul', code: 'RS', name: '에어서울', schedules: parseCsv(airSeoulCsv) },
    { id: 'parata', code: 'WE', name: '파라타항공', schedules: parseCsv(parataCsv) },
    { id: 'airpremia', code: 'YP', name: '에어프레미아', schedules: parseCsv(airPremiaCsv) },
];
