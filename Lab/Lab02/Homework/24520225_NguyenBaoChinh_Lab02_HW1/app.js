
const employees = [
    { id: 1, name: "Alice Nguyen", email: "alice@example.com", department: "Engineering", status: "Active" },
    { id: 2, name: "Bao Tran", email: "bao@example.com", department: "Marketing", status: "Active" },
    { id: 3, name: "Charlie Le", email: "charlie@example.com", department: "Finance", status: "Inactive" },
    { id: 4, name: "Diana Pham", email: "diana@example.com", department: "Engineering", status: "Active" },
    { id: 5, name: "Ethan Vo", email: "ethan@example.com", department: "Human Resources", status: "Active" },
    { id: 6, name: "Fiona Do", email: "fiona@example.com", department: "Finance", status: "Inactive" },
    { id: 7, name: "George Bui", email: "george@example.com", department: "Marketing", status: "Active" },
    { id: 8, name: "Helen Ho", email: "helen@example.com", department: "Engineering", status: "Active" },
    { id: 9, name: "Ivan Phan", email: "ivan@example.com", department: "Finance", status: "Inactive" },
    { id: 10, name: "Jenny Vu", email: "jenny@example.com", department: "Marketing", status: "Active" },
    { id: 11, name: "Kevin Dang", email: "kevin@example.com", department: "Engineering", status: "Active" },
    { id: 12, name: "Lily Mai", email: "lily@example.com", department: "Human Resources", status: "Active" }
];

const pageSize = 5;
let currentPage = 1;
let sortKey = "name";
let sortDirection = "ascending";
let selectedIds = new Set();

const searchInput = document.querySelector("#search");
const gridBody = document.querySelector("#grid-body");
const resultCount = document.querySelector("#result-count");
const pageInfo = document.querySelector("#page-info");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const selectionStatus = document.querySelector("#selection-status");
const sortButtons = document.querySelectorAll(".sort-button");
const grid = document.querySelector("#employee-grid");

function getVisibleEmployees() {
    const query = searchInput.value.trim().toLowerCase();

    return employees
        .filter(employee =>
            [employee.name, employee.email, employee.department, employee.status]
                .some(value => value.toLowerCase().includes(query))
        )
        .sort((a, b) => {
            const comparison = a[sortKey].localeCompare(b[sortKey]);
            return sortDirection === "ascending" ? comparison : -comparison;
        });
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.setAttribute("role", "gridcell");
    cell.tabIndex = -1;

    if (className) {
        cell.className = className;
    }

    cell.textContent = value;
    return cell;
}

function renderGrid() {
    const filteredEmployees = getVisibleEmployees();
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageEmployees = filteredEmployees.slice(start, start + pageSize);

    gridBody.replaceChildren();

    pageEmployees.forEach(employee => {
        const row = document.createElement("tr");
        row.setAttribute("role", "row");
        row.dataset.id = employee.id;

        row.append(
            createCell(employee.name),
            createCell(employee.email),
            createCell(employee.department),
            createCell(
                employee.status,
                employee.status === "Active" ? "status-active" : "status-inactive"
            )
        );

        const selectCell = document.createElement("td");
        selectCell.setAttribute("role", "gridcell");
        selectCell.tabIndex = -1;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.setAttribute("aria-label", `Select ${employee.name}`);
        checkbox.checked = selectedIds.has(employee.id);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedIds.add(employee.id);
            } else {
                selectedIds.delete(employee.id);
            }

            updateSelection();
            updateSelectedRows();
        });

        selectCell.append(checkbox);
        row.append(selectCell);

        row.querySelectorAll('[role="gridcell"]').forEach((cell, index) => {
            cell.tabIndex = index === 0 ? 0 : -1;
        });

        gridBody.append(row);
    });

    resultCount.textContent =
        `${filteredEmployees.length} employees found`;

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;

    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    sortButtons.forEach(button => {
        if (button.dataset.key === sortKey) {
            button.setAttribute("aria-sort", sortDirection);
        } else {
            button.removeAttribute("aria-sort");
        }
    });

    updateSelection();
    updateSelectedRows();
}

function updateSelection() {
    const count = selectedIds.size;

    selectionStatus.textContent = count === 0
        ? "No employee selected."
        : `${count} employee(s) selected.`;
}

function updateSelectedRows() {
    gridBody.querySelectorAll("tr").forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        row.classList.toggle("selected", checkbox.checked);
    });
}

searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderGrid();
});

sortButtons.forEach(button => {
    button.addEventListener("click", () => {
        const key = button.dataset.key;

        if (sortKey === key) {
            sortDirection = sortDirection === "ascending"
                ? "descending"
                : "ascending";
        } else {
            sortKey = key;
            sortDirection = "ascending";
        }

        currentPage = 1;
        renderGrid();
    });
});

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderGrid();
    }
});

nextButton.addEventListener("click", () => {
    const totalPages = Math.max(
        1,
        Math.ceil(getVisibleEmployees().length / pageSize)
    );

    if (currentPage < totalPages) {
        currentPage++;
        renderGrid();
    }
});

grid.addEventListener("keydown", event => {
    const cell = event.target.closest('[role="gridcell"]');

    if (!cell || !grid.contains(cell)) {
        return;
    }

    const cells = Array.from(
        gridBody.querySelectorAll('[role="gridcell"]')
    );

    const index = cells.indexOf(cell);
    let targetIndex = index;

    switch (event.key) {
        case "ArrowRight":
            targetIndex = Math.min(index + 1, cells.length - 1);
            break;
        case "ArrowLeft":
            targetIndex = Math.max(index - 1, 0);
            break;
        case "ArrowDown":
            targetIndex = Math.min(index + 5, cells.length - 1);
            break;
        case "ArrowUp":
            targetIndex = Math.max(index - 5, 0);
            break;
        case "Enter": {
            const row = cell.closest("tr");
            const employee = employees.find(
                item => item.id === Number(row.dataset.id)
            );

            selectionStatus.textContent =
                `Selected employee: ${employee.name}.`;
            return;
        }
        case " ":
            if (cell.querySelector('input[type="checkbox"]')) {
                event.preventDefault();
                const checkbox = cell.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event("change"));
            }
            return;
        default:
            return;
    }

    event.preventDefault();

    if (cells[targetIndex]) {
        cells.forEach(item => {
            item.tabIndex = -1;
        });

        cells[targetIndex].tabIndex = 0;
        cells[targetIndex].focus();
    }
});

renderGrid();
