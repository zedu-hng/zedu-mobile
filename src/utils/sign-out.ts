import { Dispatch } from 'react';
import { ACTIONS, Action } from '@/store/types';
import { clearAllData } from '@/utils/helper';

/**
 * Only a rejected session ends the session. A network failure (offline, DNS,
 * timeout) leaves the signed-in user untouched so the app still opens without
 * a connection.
 */
export const shouldSignOut = (result: {
  unauthorized?: boolean;
  status?: number;
}): boolean => result.unauthorized === true || result.status === 401;

/**
 * Signs the user out on this device: clears saved data and resets the whole
 * in-memory state, so nothing from this account is shown to the next one.
 */
export const signOut = async (dispatch: Dispatch<Action>) => {
  await clearAllData();
  dispatch({ type: ACTIONS.RESET_STATE });
};
