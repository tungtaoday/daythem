jest.mock('../../api/auth', () => ({
  loginWithPassword: jest.fn(),
  getMe: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('../../api/client', () => ({
  registerAuthLogout: jest.fn(),
  registerTokenGetter: jest.fn(),
  setStoredTokenFlag: jest.fn(),
}));

import { useAuthStore } from '../../store/auth';
import * as authApi from '../../api/auth';

const mockLoginApi = authApi.loginWithPassword as jest.Mock;
const mockGetMe    = authApi.getMe as jest.Mock;
const mockUpdateProfile = authApi.updateProfile as jest.Mock;

const TEACHER = {
  id: 'teacher-1', phone: '0901234567',
  name: 'Cô Lan', avatar_url: null,
};

function resetStore() {
  useAuthStore.setState({ teacher: null, token: null, isLoading: false });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
  jest.clearAllMocks();
});

// ══ loginWithPassword ══════════════════════════════════════════════════════════

describe('loginWithPassword', () => {
  test('SC-01 success stores token in localStorage and Zustand', async () => {
    mockLoginApi.mockResolvedValue({ token: 'real-jwt', teacher: TEACHER });

    await useAuthStore.getState().loginWithPassword('0901234567', 'pass123');

    expect(localStorage.getItem('auth_token')).toBe('real-jwt');
    const s = useAuthStore.getState();
    expect(s.token).toBe('real-jwt');
    expect(s.teacher?.id).toBe('teacher-1');
    expect(s.isLoading).toBe(false);
  });

  test('SC-02 success reads existing gender from localStorage', async () => {
    localStorage.setItem('teacher_gender', 'thay');
    mockLoginApi.mockResolvedValue({ token: 'real-jwt', teacher: TEACHER });

    await useAuthStore.getState().loginWithPassword('0901234567', 'pass123');

    // Gender comes from localStorage, not from API response
    expect(useAuthStore.getState().teacher?.gender).toBe('thay');
  });

  test('SC-03 success defaults gender to "co" when localStorage has no gender', async () => {
    mockLoginApi.mockResolvedValue({ token: 'real-jwt', teacher: TEACHER });

    await useAuthStore.getState().loginWithPassword('0901234567', 'pass123');

    expect(useAuthStore.getState().teacher?.gender).toBe('co');
  });

  test('SC-04 401 throws — no demo fallback, nothing stored', async () => {
    const err = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
    mockLoginApi.mockRejectedValue(err);

    await expect(
      useAuthStore.getState().loginWithPassword('0901234567', 'wrong')
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(localStorage.getItem('auth_token')).toBeNull();
    const s = useAuthStore.getState();
    expect(s.teacher).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isLoading).toBe(false);
  });

  test('SC-05 network error → demo token in Zustand ONLY (not localStorage)', async () => {
    mockLoginApi.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().loginWithPassword('0901234567', 'any');

    expect(localStorage.getItem('auth_token')).toBeNull();
    const s = useAuthStore.getState();
    expect(s.token).toMatch(/^demo-/);
    expect(s.teacher?.id).toBe('demo');
    expect(s.teacher?.phone).toBe('0901234567');
    expect(s.teacher?.name).toBeNull();
    expect(s.isLoading).toBe(false);
  });

  test('SC-06 network error reads existing gender from localStorage for demo teacher', async () => {
    localStorage.setItem('teacher_gender', 'thay');
    mockLoginApi.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().loginWithPassword('0901234567', 'any');

    expect(useAuthStore.getState().teacher?.gender).toBe('thay');
  });

  test('SC-07 token is stored BEFORE Zustand state update (no window where token is null)', async () => {
    const stateChanges: string[] = [];
    mockLoginApi.mockImplementation(async () => {
      return { token: 'real-jwt', teacher: TEACHER };
    });

    // Patch prototype so jsdom doesn't silently reject instance assignment
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      stateChanges.push(`storage:${k}`);
      origSetItem.call(this, k, v);
    };

    const unsub = useAuthStore.subscribe(() => {
      const t = useAuthStore.getState().token;
      if (t === 'real-jwt') stateChanges.push('zustand:token');
    });

    await useAuthStore.getState().loginWithPassword('0901234567', 'pass123');
    unsub();
    Storage.prototype.setItem = origSetItem;

    const tokenStorageIdx = stateChanges.indexOf('storage:auth_token');
    const zustandIdx = stateChanges.indexOf('zustand:token');
    expect(tokenStorageIdx).toBeGreaterThanOrEqual(0);
    expect(zustandIdx).toBeGreaterThanOrEqual(0);
    // storage must be written before Zustand emits
    expect(tokenStorageIdx).toBeLessThan(zustandIdx);
  });
});

// ══ loadMe ════════════════════════════════════════════════════════════════════

describe('loadMe', () => {
  test('SC-08 no stored token → returns early, API never called', async () => {
    await useAuthStore.getState().loadMe();

    expect(mockGetMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().teacher).toBeNull();
  });

  test('SC-09 stored token → calls getMe, sets teacher in Zustand', async () => {
    localStorage.setItem('auth_token', 'real-jwt');
    mockGetMe.mockResolvedValue(TEACHER);

    await useAuthStore.getState().loadMe();

    expect(mockGetMe).toHaveBeenCalledTimes(1);
    const s = useAuthStore.getState();
    expect(s.teacher?.id).toBe('teacher-1');
    expect(s.token).toBe('real-jwt');
  });

  test('SC-10 loadMe combines API teacher with gender from localStorage', async () => {
    localStorage.setItem('auth_token', 'real-jwt');
    localStorage.setItem('teacher_gender', 'thay');
    mockGetMe.mockResolvedValue(TEACHER);

    await useAuthStore.getState().loadMe();

    expect(useAuthStore.getState().teacher?.gender).toBe('thay');
  });

  test('SC-11 loadMe defaults gender to "co" when teacher_gender not in localStorage', async () => {
    localStorage.setItem('auth_token', 'real-jwt');
    // No teacher_gender key set
    mockGetMe.mockResolvedValue(TEACHER);

    await useAuthStore.getState().loadMe();

    expect(useAuthStore.getState().teacher?.gender).toBe('co');
  });

  test('SC-12 network error on getMe does NOT delete stored token', async () => {
    localStorage.setItem('auth_token', 'real-jwt');
    mockGetMe.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().loadMe();

    // Token must remain — only the 401 interceptor should clear it
    expect(localStorage.getItem('auth_token')).toBe('real-jwt');
  });

  test('SC-13 after network error on loadMe, Zustand state stays null', async () => {
    localStorage.setItem('auth_token', 'real-jwt');
    mockGetMe.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().loadMe();

    // Teacher not set because getMe failed
    expect(useAuthStore.getState().teacher).toBeNull();
  });
});

// ══ updateProfile ═════════════════════════════════════════════════════════════

describe('updateProfile', () => {
  beforeEach(() => {
    useAuthStore.setState({
      teacher: { id: 'teacher-1', phone: '0901234567', name: null, avatar_url: null, gender: 'co' },
      token: 'real-jwt',
    });
  });

  test('SC-14 success updates teacher name in Zustand', async () => {
    mockUpdateProfile.mockResolvedValue({ ...TEACHER, name: 'Cô Lan' });

    await useAuthStore.getState().updateProfile('Cô Lan', 'co');

    expect(useAuthStore.getState().teacher?.name).toBe('Cô Lan');
  });

  test('SC-15 success stores gender in localStorage', async () => {
    mockUpdateProfile.mockResolvedValue({ ...TEACHER, name: 'Thầy Minh' });

    await useAuthStore.getState().updateProfile('Thầy Minh', 'thay');

    expect(localStorage.getItem('teacher_gender')).toBe('thay');
  });

  test('SC-16 API error → optimistic update still sets teacher name locally', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().updateProfile('Cô Lan', 'co');

    // Name must be set even when API fails — so navigation proceeds
    expect(useAuthStore.getState().teacher?.name).toBe('Cô Lan');
  });

  test('SC-17 API error → gender still stored in localStorage', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Network Error'));

    await useAuthStore.getState().updateProfile('Cô Lan', 'thay');

    expect(localStorage.getItem('teacher_gender')).toBe('thay');
  });

  test('SC-18 gender defaults to existing teacher gender when not explicitly passed', async () => {
    useAuthStore.setState({
      teacher: { id: 'teacher-1', phone: '0901234567', name: null, avatar_url: null, gender: 'thay' },
      token: 'real-jwt',
    });
    mockUpdateProfile.mockResolvedValue({ ...TEACHER, name: 'Thầy Bình' });

    await useAuthStore.getState().updateProfile('Thầy Bình'); // no gender arg

    expect(localStorage.getItem('teacher_gender')).toBe('thay');
    expect(useAuthStore.getState().teacher?.gender).toBe('thay');
  });
});

// ══ setGender ═════════════════════════════════════════════════════════════════

describe('setGender', () => {
  beforeEach(() => {
    useAuthStore.setState({
      teacher: { id: 'teacher-1', phone: '0901234567', name: 'Cô Lan', avatar_url: null, gender: 'co' },
      token: 'real-jwt',
    });
  });

  test('SC-19 saves gender to localStorage', async () => {
    await useAuthStore.getState().setGender('thay');
    expect(localStorage.getItem('teacher_gender')).toBe('thay');
  });

  test('SC-20 updates gender in Zustand state', async () => {
    await useAuthStore.getState().setGender('thay');
    expect(useAuthStore.getState().teacher?.gender).toBe('thay');
  });

  test('SC-21 does not call any API', async () => {
    await useAuthStore.getState().setGender('thay');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockGetMe).not.toHaveBeenCalled();
  });
});

// ══ logout ════════════════════════════════════════════════════════════════════

describe('logout', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'real-jwt');
    useAuthStore.setState({
      teacher: { id: 'teacher-1', phone: '0901234567', name: 'Cô Lan', avatar_url: null },
      token: 'real-jwt',
    });
  });

  test('SC-22 deletes auth_token from localStorage', async () => {
    await useAuthStore.getState().logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  test('SC-23 clears teacher and token from Zustand', async () => {
    await useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.teacher).toBeNull();
    expect(s.token).toBeNull();
  });

  test('SC-24 gender key in localStorage is NOT cleared on logout (intentional: persists preference)', async () => {
    localStorage.setItem('teacher_gender', 'thay');

    await useAuthStore.getState().logout();

    // Gender persists so next login picks it up automatically
    expect(localStorage.getItem('teacher_gender')).toBe('thay');
  });
});
