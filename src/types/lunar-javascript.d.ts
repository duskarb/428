declare module "lunar-javascript" {
  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarDate
  }

  export const Lunar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): LunarDate
  }

  interface SolarDate {
    toYmd(): string
    getLunar(): LunarDate
  }

  interface LunarDate {
    getSolar(): SolarDate
    getEightChar(): EightChar
  }

  interface EightChar {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    getYearGan(): string
    getMonthGan(): string
    getDayGan(): string
    getTimeGan(): string
    getYearShiShenGan(): string
    getMonthShiShenGan(): string
    getDayShiShenGan(): string
    getTimeShiShenGan(): string
    getDayWuXing(): string
  }
}
