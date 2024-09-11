export interface Decision {
    id: string;
    title: string;
    status: 'DRAFTED' | 'PROPSED' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
    context: string;
    decsion: string;
    consequecne: string;
}
