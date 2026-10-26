// app.js - Combined Exercise 2 (Reactive Task Manager) & Exercise 3 (Resilient State Machine)

import {
    createElement as h,
    useState,
    createRoot
} from "./mini_react.js";

import {
    STATES,
    createInitialState,
    transition
} from "./state_machine.js";

// --- Exercise 3: Async Data Simulation ---
async function fetchFeed() {
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Simulate 30% connection failure for resilience testing
    if (Math.random() < 0.3) {
        throw new Error("Unable to connect. Please try again.");
    }

    return [
        { id: 1, title: "Mini React State Machine" },
        { id: 2, title: "Asynchronous Data Handling" },
        { id: 3, title: "Skeleton Loading UI" }
    ];
}

let latestRequestId = 0;

// --- Unified App Component ---
export function App() {
    // Top-level Navigation Tab State
    const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "EX2" | "EX3"

    // Exercise 2 States (unconditionally initialized)
    const [tasks, setTasks] = useState([
        { id: 1, title: "Review PR", completed: false },
        { id: 2, title: "Verify AST", completed: false }
    ]);
    const [filter, setFilter] = useState("ALL");
    const [input, setInput] = useState("");

    // Exercise 3 State (unconditionally initialized)
    const [feedState, setFeedState] = useState(createInitialState());

    // --- Exercise 2 Logic ---
    const visibleTasks = tasks.filter(task => {
        if (filter === "ACTIVE") return !task.completed;
        if (filter === "COMPLETED") return task.completed;
        return true;
    });

    function addTask(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }

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

    // --- Exercise 3 Logic ---
    const loadFeedData = async () => {
        const requestId = ++latestRequestId;

        setFeedState({ status: STATES.LOADING });

        try {
            const items = await fetchFeed();

            // Ignore outdated responses (race condition safeguard)
            if (requestId !== latestRequestId) {
                return;
            }

            setFeedState(transition({
                status: STATES.SUCCESS,
                data: items
            }));
        } catch (error) {
            if (requestId !== latestRequestId) {
                return;
            }

            setFeedState(transition({
                status: STATES.ERROR,
                error: error instanceof Error
                    ? error.message
                    : "An unexpected error occurred."
            }));
        }
    };

    const filters = ["ALL", "ACTIVE", "COMPLETED"];

    // Render Exercise 2 View
    const renderExercise2 = () =>
        h("section", { className: "exercise-card", id: "exercise-2" },
            h("div", { className: "card-title-bar" },
                h("h2", {}, "Reactive Task Manager"),
                h("span", { className: "card-badge" }, "Exercise 2")
            ),

            h("div", { className: "task-stats" },
                h("span", {}, "Total: ", h("strong", {}, String(tasks.length))),
                h("span", {}, "Remaining: ", h("strong", {}, String(tasks.filter(t => !t.completed).length)))
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

            h("div", { className: "task-list", "aria-label": "Task list" },
                ...(visibleTasks.length
                    ? visibleTasks.map(task =>
                        h("div", { className: "task", key: task.id },
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

    // Render Exercise 3 View
    const renderExercise3 = () =>
        h("section", { className: "exercise-card", id: "exercise-3" },
            h("div", { className: "card-title-bar" },
                h("h2", {}, "Resilient Data Feed"),
                h("span", { className: "card-badge" }, "Exercise 3")
            ),

            h("header", { className: "feed-header" },
                h("p", {}, "State Machine & Skeleton Loading UI")
            ),

            feedState.status === STATES.IDLE
                ? h("div", { className: "state-panel" },
                    h("p", {}, "Ready to load data feed."),
                    h("button", {
                        type: "button",
                        className: "primary-btn",
                        onClick: loadFeedData
                    }, "Load Data")
                )
                : null,

            feedState.status === STATES.LOADING
                ? h("div", {
                    className: "skeleton-list",
                    "aria-label": "Loading data",
                    "aria-busy": "true"
                },
                    ...[1, 2, 3].map(id =>
                        h("div", {
                            className: "skeleton-card",
                            key: id
                        },
                            h("div", { className: "skeleton skeleton-title" }),
                            h("div", { className: "skeleton skeleton-line" }),
                            h("div", { className: "skeleton skeleton-short" })
                        )
                    )
                )
                : null,

            feedState.status === STATES.SUCCESS
                ? h("div", { className: "feed-list" },
                    h("h3", {}, "Loaded Feed Items"),
                    ...(feedState.data || []).map(item =>
                        h("article", {
                            className: "feed-card",
                            key: item.id
                        },
                            h("h4", {}, item.title)
                        )
                    ),
                    h("div", { className: "feed-actions" },
                        h("button", {
                            type: "button",
                            className: "primary-btn",
                            onClick: loadFeedData
                        }, "Refresh Data")
                    )
                )
                : null,

            feedState.status === STATES.ERROR
                ? h("div", {
                    className: "error-panel",
                    role: "alert"
                },
                    h("h3", {}, "Connection Failed"),
                    h("p", {}, feedState.error),
                    h("button", {
                        type: "button",
                        className: "retry-btn",
                        onClick: loadFeedData
                    }, "Retry Connection")
                )
                : null
        );

    // Root UI Layout with Tabs and Panels
    const showEx2 = activeTab === "ALL" || activeTab === "EX2";
    const showEx3 = activeTab === "ALL" || activeTab === "EX3";

    return h(
        "div",
        { className: "app-wrapper" },

        h("header", { className: "app-header" },
            h("span", { className: "badge" }, "Lab 02 — Mini React Engine"),
            h("h1", {}, "Web Application Development"),
            h("p", {}, "Interactive Showcase: Exercise 2 & Exercise 3"),

            h("nav", { className: "tab-nav", "aria-label": "Select Exercise View" },
                h("button", {
                    type: "button",
                    className: `tab-btn ${activeTab === "ALL" ? "active" : ""}`,
                    onClick: () => setActiveTab("ALL")
                }, "Tất cả (Both)"),
                h("button", {
                    type: "button",
                    className: `tab-btn ${activeTab === "EX2" ? "active" : ""}`,
                    onClick: () => setActiveTab("EX2")
                }, "Exercise 2: Task Manager"),
                h("button", {
                    type: "button",
                    className: `tab-btn ${activeTab === "EX3" ? "active" : ""}`,
                    onClick: () => setActiveTab("EX3")
                }, "Exercise 3: Resilient Feed")
            )
        ),

        h("main", {
            className: `content-grid ${activeTab === "ALL" ? "dual-view" : ""}`
        },
            showEx2 ? renderExercise2() : null,
            showEx3 ? renderExercise3() : null
        )
    );
}

// Mount Root Component
const appRoot = document.getElementById("app");
if (appRoot) {
    createRoot(appRoot, App);
}