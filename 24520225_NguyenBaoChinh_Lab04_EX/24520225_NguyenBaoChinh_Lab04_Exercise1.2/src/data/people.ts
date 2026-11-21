export interface Person {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
}

export const people: Person[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Software Engineer',
    department: 'Information Technology',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Nguyen Bao Chinh',
    role: 'Student',
    department: 'Information Technology',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Tran Trong Khiem',
    role: 'Lecturer',
    department: 'Information Technology',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Emily Tran',
    role: 'UX Researcher',
    department: 'Design Systems',
    status: 'On Leave',
  },
];
