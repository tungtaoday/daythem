jest.mock('../../api/classes', () => ({
  listClasses: jest.fn(),
  createClass: jest.fn(),
  updateClass: jest.fn(),
  archiveClass: jest.fn(),
  getClass: jest.fn(),
}));

jest.mock('../../api/students', () => ({
  listStudents: jest.fn(),
  addStudent: jest.fn(),
  setStudentFee: jest.fn(),
}));

import { useClassesStore } from '../../store/classes';
import * as classApi from '../../api/classes';
import * as studentApi from '../../api/students';

const mockListClasses    = classApi.listClasses    as jest.Mock;
const mockCreateClass    = classApi.createClass    as jest.Mock;
const mockUpdateClass    = classApi.updateClass    as jest.Mock;
const mockListStudents   = studentApi.listStudents as jest.Mock;
const mockAddStudent     = studentApi.addStudent   as jest.Mock;
const mockSetStudentFee  = studentApi.setStudentFee as jest.Mock;

const FAKE_CLASS = {
  id: 'cls-1', name: 'Toán 10A', subject: 'Toán', grade: '10',
  default_fee: 500000, fee_type: 'default', student_count: 5,
  schedule: null, zalo_group_id: null,
};

const FAKE_STUDENT = {
  id: 'stu-1', name: 'Nguyễn An', parent_name: null,
  parent_phone: null, note: null, fee_setting: null,
};

function resetStore() {
  useClassesStore.setState({ classes: [], students: {}, isLoading: false });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

// ── fetchClasses ──────────────────────────────────────────────────────────────

test('SC-12 fetchClasses success updates classes state', async () => {
  mockListClasses.mockResolvedValue([FAKE_CLASS]);

  await useClassesStore.getState().fetchClasses();

  expect(useClassesStore.getState().classes).toEqual([FAKE_CLASS]);
  expect(useClassesStore.getState().isLoading).toBe(false);
});

test('SC-13 fetchClasses API error does not throw and leaves classes empty', async () => {
  mockListClasses.mockRejectedValue(
    Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
  );

  await expect(useClassesStore.getState().fetchClasses()).resolves.toBeUndefined();

  expect(useClassesStore.getState().classes).toEqual([]);
  expect(useClassesStore.getState().isLoading).toBe(false);
});

test('SC-14 fetchStudents API error does not throw', async () => {
  mockListStudents.mockRejectedValue(new Error('Network Error'));

  await expect(
    useClassesStore.getState().fetchStudents('cls-1')
  ).resolves.toBeUndefined();

  expect(useClassesStore.getState().students['cls-1']).toBeUndefined();
});

test('SC-15 fetchClasses 500 server error does not throw', async () => {
  mockListClasses.mockRejectedValue(
    Object.assign(new Error('Internal Server Error'), { response: { status: 500 } })
  );

  await expect(useClassesStore.getState().fetchClasses()).resolves.toBeUndefined();
  expect(useClassesStore.getState().isLoading).toBe(false);
});

// ── createClass ───────────────────────────────────────────────────────────────

test('SC-16 createClass appends new class to Zustand list', async () => {
  const newClass = { ...FAKE_CLASS, id: 'cls-2', name: 'Lý 11B', student_count: 0 };
  mockCreateClass.mockResolvedValue(newClass);

  const result = await useClassesStore.getState().createClass({
    name: 'Lý 11B', subject: 'Lý', grade: '11', default_fee: 400000, fee_type: 'default',
  } as any);

  expect(result).toEqual(newClass);
  expect(useClassesStore.getState().classes).toContainEqual(newClass);
});

test('SC-17 createClass with existing classes preserves existing list', async () => {
  useClassesStore.setState({ classes: [FAKE_CLASS] });
  const newClass = { ...FAKE_CLASS, id: 'cls-2', name: 'Lý 11B', student_count: 0 };
  mockCreateClass.mockResolvedValue(newClass);

  await useClassesStore.getState().createClass({} as any);

  expect(useClassesStore.getState().classes).toHaveLength(2);
  expect(useClassesStore.getState().classes[0]).toEqual(FAKE_CLASS);
});

test('SC-18 createClass API error propagates to caller', async () => {
  mockCreateClass.mockRejectedValue(new Error('Network Error'));

  await expect(
    useClassesStore.getState().createClass({} as any)
  ).rejects.toThrow('Network Error');

  expect(useClassesStore.getState().classes).toEqual([]);
});

// ── updateClass ───────────────────────────────────────────────────────────────

test('SC-19 updateClass replaces the matching class in list', async () => {
  useClassesStore.setState({ classes: [FAKE_CLASS] });
  const updated = { ...FAKE_CLASS, name: 'Toán 10A (sáng)', default_fee: 600000 };
  mockUpdateClass.mockResolvedValue(updated);

  await useClassesStore.getState().updateClass('cls-1', { name: 'Toán 10A (sáng)' });

  const list = useClassesStore.getState().classes;
  expect(list).toHaveLength(1);
  expect(list[0].name).toBe('Toán 10A (sáng)');
  expect(list[0].default_fee).toBe(600000);
});

test('SC-20 updateClass API error propagates to caller', async () => {
  useClassesStore.setState({ classes: [FAKE_CLASS] });
  mockUpdateClass.mockRejectedValue(
    Object.assign(new Error('Forbidden'), { response: { status: 403 } })
  );

  await expect(
    useClassesStore.getState().updateClass('cls-1', {})
  ).rejects.toMatchObject({ response: { status: 403 } });

  // List unchanged
  expect(useClassesStore.getState().classes[0]).toEqual(FAKE_CLASS);
});

// ── fetchStudents ─────────────────────────────────────────────────────────────

test('SC-21 fetchStudents success sets students keyed by classId', async () => {
  mockListStudents.mockResolvedValue([FAKE_STUDENT]);

  await useClassesStore.getState().fetchStudents('cls-1');

  expect(useClassesStore.getState().students['cls-1']).toEqual([FAKE_STUDENT]);
});

test('SC-22 fetchStudents does not overwrite other classes students', async () => {
  useClassesStore.setState({ students: { 'cls-2': [FAKE_STUDENT] } });
  mockListStudents.mockResolvedValue([]);

  await useClassesStore.getState().fetchStudents('cls-1');

  expect(useClassesStore.getState().students['cls-2']).toEqual([FAKE_STUDENT]);
  expect(useClassesStore.getState().students['cls-1']).toEqual([]);
});

// ── addStudent ────────────────────────────────────────────────────────────────

test('SC-23 addStudent appends student to class and increments student_count', async () => {
  useClassesStore.setState({ classes: [FAKE_CLASS], students: { 'cls-1': [] } });
  mockAddStudent.mockResolvedValue(FAKE_STUDENT);

  const result = await useClassesStore.getState().addStudent('cls-1', { name: 'Nguyễn An' });

  expect(result).toEqual(FAKE_STUDENT);
  expect(useClassesStore.getState().students['cls-1']).toContainEqual(FAKE_STUDENT);
  expect(useClassesStore.getState().classes[0].student_count).toBe(6);
});

test('SC-24 addStudent with no prior fetchStudents initialises empty list', async () => {
  useClassesStore.setState({ classes: [FAKE_CLASS] });
  mockAddStudent.mockResolvedValue(FAKE_STUDENT);

  await useClassesStore.getState().addStudent('cls-1', { name: 'Nguyễn An' });

  expect(useClassesStore.getState().students['cls-1']).toEqual([FAKE_STUDENT]);
});

test('SC-25 addStudent API error propagates to caller', async () => {
  mockAddStudent.mockRejectedValue(new Error('Network Error'));

  await expect(
    useClassesStore.getState().addStudent('cls-1', {})
  ).rejects.toThrow('Network Error');

  expect(useClassesStore.getState().students['cls-1']).toBeUndefined();
});

// ── setStudentFee ─────────────────────────────────────────────────────────────

test('SC-26 setStudentFee calls API with correct arguments', async () => {
  mockSetStudentFee.mockResolvedValue(undefined);

  await useClassesStore.getState().setStudentFee('stu-1', {
    fee_type: 'discount', amount: 250000,
  });

  expect(mockSetStudentFee).toHaveBeenCalledWith('stu-1', {
    fee_type: 'discount', amount: 250000,
  });
});

test('SC-27 setStudentFee API error propagates to caller', async () => {
  mockSetStudentFee.mockRejectedValue(new Error('Network Error'));

  await expect(
    useClassesStore.getState().setStudentFee('stu-1', { fee_type: 'free' })
  ).rejects.toThrow('Network Error');
});
