import { H3Event, type SessionConfig, type SessionData } from 'h3';
import { getSecretValues } from './secret-values';

interface SessionAttributes {
    email: string;
    username: string;
}

interface SessionAttributesR extends SessionAttributes {
    active: boolean;
}

const { sessionPassword } = getSecretValues();
const getSessionConfig = (event: H3Event): SessionConfig => {
    return {
        password: sessionPassword,
        cookie: { httpOnly: true, secure: true, sameSite: 'strict' },
    };
}

export const saveSessionData = async (event: H3Event, data: SessionData<SessionAttributes>): Promise<SessionAttributesR> => {
    return updateSession(event, getSessionConfig(event), { ...data, active: true }).then(session => session.data);
}

export const getSessionData = async (event: H3Event): Promise<SessionData<SessionAttributesR>> => {
    return getSession<SessionAttributes & { active: boolean }>(event, getSessionConfig(event)).then(session => session.data);
}

export const clearSessionData = async (event: H3Event) => {
    return clearSession(event, getSessionConfig(event));
}