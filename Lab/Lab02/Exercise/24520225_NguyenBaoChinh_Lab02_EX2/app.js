// app.js

import {
    createElement as h,
    useState,
    createRoot
} from "./mini_react.js";

function TaskApp() {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Review PR", completed: false },
        { id: 2, title: "Verify AST", completed: false }
    ]);

    const [filter, setFilter] = useState("ALL");
    const [input, setInput] = useState("");

    const visibleTasks = tasks.filter(task => {
        if (filter === "ACTIVE") return !task.completed;
        if (filter === "COMPLETED") return task.completed;
        return true;
    });

    function addTask(event) {
        event.preventDefault();

        const title = input.trim();
        if (!title) return;

        setTasks(previous => [
            ...previous,
            {
                id: Date.now(),
                title,
                completed: false
            }
        ]);

        setInput("");
    }

    function toggleTask(id) {
        setTasks(previous =>
            previous.map(task =>
                task.id === id
                    ? { ...task, completed: !task.completed }
                    : task
            )
        );
    }

    function deleteTask(id) {
        setTasks(previous =>
            previous.filter(task => task.id !== id)
        );
    }

    const filters = ["ALL", "ACTIVE", "COMPLETED"];

    return h(
        "main",
        { className: "app-container" },

        h("header", {},
            h("h1", {}, "Reactive Task Manager"),
            h("p", {}, `Tasks: ${tasks.length}`),
            h("p", {}, `Remaining: ${tasks.filter(t => !t.completed).length}`)
        ),

        h("form", {
            className: "controls",
            onSubmit: addTask
        },
            h("input", {
                type: "text",
                placeholder: "Enter a task...",
                value: input,
                onInput: event => setInput(event.target.value),
                "aria-label": "New task"
            }),
            h("button", { type: "submit" }, "Add Task")
        ),

        h("nav", {
            className: "filters",
            "aria-label": "Filter tasks"
        },
            ...filters.map(name =>
                h("button", {
                    type: "button",
                    className: filter === name ? "active" : "",
                    onClick: () => setFilter(name),
                    "aria-pressed": filter === name
                }, name)
            )
        ),

        h("section", { "aria-label": "Task list" },
            ...(visibleTasks.length
                ? visibleTasks.map(task =>
                    h("div", { className: "task" },
                        h("input", {
                            type: "checkbox",
                            checked: task.completed,
                            onChange: () => toggleTask(task.id),
                            "aria-label": `Complete ${task.title}`
                        }),
                        h("span", {
                            className: task.completed ? "completed" : ""
                        }, task.title),
                        h("button", {
                            type: "button",
                            className: "delete",
                            onClick: () => deleteTask(task.id),
                            "aria-label": `Delete ${task.title}`
                        }, "Delete")
                    )
                )
                : [
                    h("p", { className: "empty" }, "No tasks to display.")
                ]
            )
        )
    );
}

const appRoot = document.getElementById("app");
createRoot(appRoot, TaskApp);