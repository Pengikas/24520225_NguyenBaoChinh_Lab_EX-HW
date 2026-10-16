// src/App.tsx
import { useState } from 'react';
import { DataGrid } from './DataGrid';
import { ColumnDef } from './data-grid-contract';

interface EmployeeRecord {
    id: string;
    name: string;
    department: string;
    role: string;
    status: string;
}

const SAMPLE_DATA: EmployeeRecord[] = [
    { id: 'EMP-001', name: 'Nguyen Van A', department: 'Information Systems', role: 'Lead Architect', status: 'Active' },
    { id: 'EMP-002', name: 'Tran Thi B', department: 'Security Engineering', role: 'AppSec Analyst', status: 'Active' },
    { id: 'EMP-003', name: 'Le Van C', department: 'Data Science', role: 'ML Engineer', status: 'On Leave' },
    { id: 'EMP-004', name: 'Pham Thi D', department: 'Cloud Infrastructure', role: 'DevOps Engineer', status: 'Active' },
    { id: 'EMP-005', name: 'Hoang Van E', department: 'Frontend Platform', role: 'Accessibility Specialist', status: 'Active' },
    { id: 'EMP-006', name: 'Vu Thi F', department: 'Information Systems', role: 'Database Administrator', status: 'Active' },
    { id: 'EMP-007', name: 'Dang Van G', department: 'Quality Assurance', role: 'Automation Engineer', status: 'Inactive' },
];

const COLUMNS: ColumnDef<EmployeeRecord>[] = [
    { header: 'Employee ID', accessorKey: 'id', sortable: true },
    { header: 'Full Name', accessorKey: 'name', sortable: true },
    { header: 'Department', accessorKey: 'department', sortable: true },
    { header: 'Role', accessorKey: 'role', sortable: false },
    { header: 'Status', accessorKey: 'status', sortable: true },
];

export function App() {
    const [activeRecord, setActiveRecord] = useState<EmployeeRecord | null>(null);

    return (
        <main style={{ maxWidth: '1024px', margin: '0 auto', padding: '1rem' }}>
            <h1>Enterprise Employee Directory</h1>
            <p>
                Use <strong>Arrow Keys</strong> to navigate cells, <strong>Space</strong> to toggle row selection, and <strong>Enter</strong> to inspect a record.
            </p>

            <DataGrid<EmployeeRecord>
                data={SAMPLE_DATA}
                columns={COLUMNS}
                ariaLabel="Enterprise Employee Directory Data Grid"
                onRowSelect={(item) => setActiveRecord(item)}
            />

            {activeRecord && (
                <aside
                    aria-live="polite"
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        border: '2px solid #1d4ed8',
                        borderRadius: '4px',
                        backgroundColor: '#eff6ff',
                        color: '#1e3a8a',
                    }}
                >
                    <strong>Selected Record Action (Enter):</strong> {activeRecord.name} ({activeRecord.id}) — {activeRecord.role}
                </aside>
            )}
        </main>
    );
}

export default App;