const data = {} as { [key: string]: any };

export const dataAccessor = () => {
    return {
        list: () => Object.values(data),
        get: (key: string) => data[key],
        set: (key: string, value: any) => {
            if (value) {
                data[key] = value;
            } else {
                delete data[key];
            }
        }
    }
}