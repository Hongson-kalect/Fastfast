import { DRIVE_APPDATA_SCOPE, GOOGLE_WEB_CLIENT_ID } from "@/constants/google";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";

export type GoogleAccount = {
  email: string;
  name: string | null;
  photo: string | null;
};

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: [DRIVE_APPDATA_SCOPE],
  });
  configured = true;
};

const toAccount = ({ user }: User): GoogleAccount => ({
  email: user.email,
  name: user.name,
  photo: user.photo,
});

/** Tài khoản đã đăng nhập trước đó (không hiện giao diện), null nếu chưa. */
export const getSignedInAccount = async (): Promise<GoogleAccount | null> => {
  ensureConfigured();
  if (!GoogleSignin.hasPreviousSignIn()) return null;

  try {
    const response = await GoogleSignin.signInSilently();
    return response.type === "success" ? toAccount(response.data) : null;
  } catch {
    return null;
  }
};

/**
 * Đăng nhập Google và xin quyền thư mục ẩn trên Drive.
 * Trả về null nếu người dùng huỷ.
 */
export const signInWithGoogle = async (): Promise<GoogleAccount | null> => {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    // Người dùng có thể bỏ tick quyền Drive trên màn hình xin quyền
    if (!response.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
      const granted = await GoogleSignin.addScopes({
        scopes: [DRIVE_APPDATA_SCOPE],
      });
      if (!granted || !granted.data?.scopes.includes(DRIVE_APPDATA_SCOPE)) {
        throw new Error("Drive permission was not granted");
      }
    }

    return toAccount(response.data);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
};

export const signOutGoogle = async () => {
  ensureConfigured();
  await GoogleSignin.signOut();
};

/** Access token cho Google API; thư viện tự làm mới khi hết hạn. */
export const getGoogleAccessToken = async () => {
  ensureConfigured();
  return (await GoogleSignin.getTokens()).accessToken;
};

/** Bỏ token đang cache (VD bị Google từ chối) để lần sau lấy token mới. */
export const invalidateGoogleAccessToken = async (token: string) => {
  ensureConfigured();
  await GoogleSignin.clearCachedAccessToken(token);
};
