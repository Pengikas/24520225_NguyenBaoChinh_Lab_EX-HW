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
    name: 'Jane Smith',
    role: 'Product Manager',
    department: 'Product Development',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Alex Nguyen',
    role: 'Frontend Architect',
    department: 'Engineering',
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
