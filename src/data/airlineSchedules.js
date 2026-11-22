import airSeoulCsv from './airseoul-weekly-schedules.csv?raw';
import parataCsv from './parata-weekly-schedules.csv?raw';
import airPremiaCsv from './airpremia-weekly-schedules.csv?raw';

function parseCsv(csv) {
    const [header, ...lines] = csv.trim().split('\n');
    const keys = header.split(',');
    return lines.map((line) => {
        const schedule = Object.fromEntries(line.split(',').map((value, index) => [keys[index], value]));
        schedule.weekly_frequency = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].reduce(
            (count, day) => count + Number(schedule[day] || 0),
            0,
        );
        return schedule;
    });
}

export const airlineSchedules = [
    {
        id: 'airseoul',
        code: 'RS',
        name: '에어서울',
        logo: `${import.meta.env.BASE_URL}airline-logos/air-seoul.svg`,
        theme: 'mint',
        schedules: parseCsv(airSeoulCsv),
    },
    {
        id: 'parata',
        code: 'WE',
        name: '파라타항공',
        logo: `${import.meta.env.BASE_URL}airline-logos/parata-air.svg`,
        theme: 'sky',
        schedules: parseCsv(parataCsv),
    },
    {
        id: 'airpremia',
        code: 'YP',
        name: '에어프레미아',
        logo: `${import.meta.env.BASE_URL}airline-logos/air-premia.svg`,
        theme: 'sunrise',
        schedules: parseCsv(airPremiaCsv),
    },
];
