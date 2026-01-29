declare module 'google-trends-api' {
  interface InterestOverTimeOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
    resolution?: string;
    granularTimeResolution?: boolean;
  }

  export function interestOverTime(options: InterestOverTimeOptions): Promise<string>;
  export function interestByRegion(options: any): Promise<string>;
  export function relatedQueries(options: any): Promise<string>;
  export function relatedTopics(options: any): Promise<string>;

  const googleTrends: {
    interestOverTime: typeof interestOverTime;
    interestByRegion: typeof interestByRegion;
    relatedQueries: typeof relatedQueries;
    relatedTopics: typeof relatedTopics;
  };

  export default googleTrends;
}
