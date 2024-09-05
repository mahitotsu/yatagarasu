import { H3Event, type SessionConfig, type SessionData } from 'h3';

interface SessionAttributes {
    email: string;
    username: string;
}


const getSessionConfig = (event: H3Event): SessionConfig => {
    const runtimeConfig = useRuntimeConfig(event);
    return {
        password: runtimeConfig.sessionPassword,
        cookie: { httpOnly: true, secure: true, sameSite: 'strict' },
    };
}

export const saveSessionData = async (event: H3Event, data: SessionData<SessionAttributes>): Promise<SessionData> => {
    return updateSession(event, getSessionConfig(event), data).then(session => session.data);
}

export const getSessionData = async (event: H3Event): Promise<SessionData<SessionAttributes>> => {
    return getSession<SessionAttributes>(event, getSessionConfig(event)).then(session => session.data);
}

export const clearSessionData = async (event: H3Event) => {
    return clearSession(event, getSessionConfig(event));
}