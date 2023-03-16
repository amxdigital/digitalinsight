/**
 * References - https://www.chartjs.org/docs/2.9.4/axes/cartesian/time.html#display-formats, https://momentjs.com/docs/#/parsing/
 * Note - for each unit you wll need to adjust limits.minRange || stepsize based on data
 */
export const displayFormatsArr = [
    {
        order: 0,
        name: "millisecond",
        label: "Millisecond" || "MILLISECOND",
        value: "h:mm:ss.SSS a",
        outputExample: "11:20:01.123 AM",
        successor: "second" || 1,
        predecessor: "",
        timeValue: 1000,
        ms: 1
    },
    {
        order: 1,
        name: "second",
        label: "Second" || "SECOND",
        value: "h:mm:ss a",
        outputExample: "11:20:01 AM",
        successor: "minute" || 2,
        predecessor: "millisecond" || 0,
        timeValue: 60,
        ms: 1000
    },
    {
        order: 2,
        name: "minute",
        label: "Minute" || "MINUTE",
        value: "h:mm a",
        outputExample: "11:20 AM",
        successor: "hour" || 3,
        predecessor: "second" || 1,
        timeValue: 60,
        ms: 1000 * 60
    },
    {
        order: 3,
        name: "hour",
        label: "Hour" || "HOUR",
        value: "hA",
        outputExample: "11 AM",
        successor: "day" || 4,
        predecessor: "minute" || 2,
        timeValue: 24,
        ms: 1000 * 60 * 60
    },
    {
        order: 4,
        name: "day",
        label: "Day" || "DAY",
        value: "MMM D",
        outputExample: "Sep 4",
        successor: "week" || 5,
        predecessor: "hour" || 3,
        timeValue: 7,
        ms: 1000 * 60 * 60 * 24
    },
    {
        order: 5,
        name: "week",
        label: "Week" || "WEEK",
        value: "ll",
        outputExample: "Sep 4 2015",
        successor: "month" || 6,
        predecessor: "day" || 4,
        timeValue: getWeeksCountInMonth(),
        ms: 1000 * 60 * 60 * 24 * 7
    },
    {
        order: 6,
        name: "month",
        label: "Month" || "MONTH",
        value: "MMM YYYY",
        outputExample: "Sep 2015",
        successor: "quarter" || 7,
        predecessor: "week" || 5,
        timeValue: getDaysCountInMonth(),
        ms: 1000 * 60 * 60 * 24 * getDaysCountInMonth()
    },
    {
        order: 7,
        name: "quarter",
        label: "Quarter" || "QUARTER",
        value: "[Q]Q - YYYY",
        outputExample: "Q3 - 2015",
        successor: "year" || 8,
        predecessor: "month" || 6,
        timeValue: 4,
        ms: 1000 * 60 * 60 * 24 * getDaysCountInQuarter()
    },
    {
        order: 8,
        name: "year",
        label: "Year" || "YEAR",
        value: "YYYY",
        outputExample: "2015",
        successor: "",
        predecessor: "quarter" || 7,
        timeValue: 10,
        ms: 1000 * 60 * 60 * 24 * getDaysCountInYear()
    }
];

export const displayFormatsMap = {};
displayFormatsArr.forEach(el => {
    displayFormatsMap[el.name] = { ...el };
});

export const defaultDisplayFormat = "day";

export function getDaysCountInMonth(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    return new Date(month, year, 0).getDate();
}

/**
 * note: Assuming January through March are considered Q1 (default quarter argument value)
 */
export function getDaysCountInQuarter(quarter = Math.floor((new Date().getMonth() + 3) / 3)) {
    const leapYear = [91, 91, 92, 92];
    const normalYear = [90, 91, 92, 92];
    if (isLeap()) {
        return leapYear[quarter - 1];
    } else {
        return normalYear[quarter - 1];
    }
}

export function isLeap(year = new Date().getFullYear()) {
    return new Date(year, 1, 29).getDate() === 29;
}

export function getDaysCountInYear(year = new Date().getFullYear()) {
    return isLeap(year) ? 366 : 365;
}

/**
 * note: month is in the range 0..11, just like Dates in js
 */
export function getWeeksInMonth(year = new Date().getFullYear(), month = new Date().getMonth()) {
    const weeks = [],
        firstDate = new Date(year, month, 1),
        lastDate = new Date(year, month + 1, 0),
        numDays = lastDate.getDate();

    let dayOfWeekCounter = firstDate.getDay();

    for (let date = 1; date <= numDays; date++) {
        if (dayOfWeekCounter === 0 || weeks.length === 0) {
            weeks.push([]);
        }
        weeks[weeks.length - 1].push(date);
        dayOfWeekCounter = (dayOfWeekCounter + 1) % 7;
    }

    return weeks
        .filter(w => !!w.length)
        .map(w => ({
            start: w[0],
            end: w[w.length - 1],
            dates: w
        }));
}

/**
 * note: month is in the range 1..12
 */
export function getWeeksCountInMonth(
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1,
    startDayOfWeek
) {
    var firstDayOfWeek = startDayOfWeek || 0; // Get the first day of week week day (0: Sunday, 1: Monday, ...)

    var firstOfMonth = new Date(year, month - 1, 1);
    var lastOfMonth = new Date(year, month, 0);
    var numberOfDaysInMonth = lastOfMonth.getDate();
    var firstWeekDay = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;

    var used = firstWeekDay + numberOfDaysInMonth;

    return Math.ceil(used / 7);
}

export function convertDaysToMilliseconds(days = 0) {
    return 1000 * 60 * 60 * 24 * days;
}

export const getFilteredDisplayFormats = () => {
    let result = {};
    displayFormatsArr.forEach(el => {
        if (el.name != "millisecond" && el.name != "second") {
            result[el.name] = el.value;
        }
    });
    return result;
};

export const getDayFilteredDisplayFormats = () => {
    let result = {};
    displayFormatsArr.forEach(el => {
        if (el.name != "week" && el.name != "month" && el.name != "quarter" && el.name != "year") {
            result[el.name] = el.value;
        }
    });
    return result;
};

export const colorArray = [
    "#FF6633",
    "#FFB399",
    "#FF33FF",
    "#FFFF99",
    "#00B3E6",
    "#E6B333",
    "#3366E6",
    "#999966",
    "#99FF99",
    "#B34D4D",
    "#80B300",
    "#809900",
    "#E6B3B3",
    "#6680B3",
    "#66991A",
    "#FF99E6",
    "#CCFF1A",
    "#FF1A66",
    "#E6331A",
    "#33FFCC",
    "#66994D",
    "#B366CC",
    "#4D8000",
    "#B33300",
    "#CC80CC",
    "#66664D",
    "#991AFF",
    "#E666FF",
    "#4DB3FF",
    "#1AB399",
    "#E666B3",
    "#33991A",
    "#CC9999",
    "#B3B31A",
    "#00E680",
    "#4D8066",
    "#809980",
    "#E6FF80",
    "#1AFF33",
    "#999933",
    "#FF3380",
    "#CCCC00",
    "#66E64D",
    "#4D80CC",
    "#9900B3",
    "#E64D66",
    "#4DB380",
    "#FF4D4D",
    "#99E6E6",
    "#6666FF"
];

export const getReportData = (profileData)=> {
    let columnHeaders = [
      "CIVIL ID",
      "CUSTOMER NAME",
      "EMAIL ID",
      "COUNTRY NAME",
      "MOBILE NO.",
      "WHATSAPP NO."
    ];
    let rows = profileData.map(data => ([
        `${data.identityInt || "-"}`,
        `${data.name || "-"}`,
        `${data.emailId || "-"}`,
        `${data.countryName || "-"}`,
        `${data.mobileNo || "-"}`,
        `${data.whatsupNo || "-"}`,
      ])
    );
    return {columnHeaders, rows};
}
