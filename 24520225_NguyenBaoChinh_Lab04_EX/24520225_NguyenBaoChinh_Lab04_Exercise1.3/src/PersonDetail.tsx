import './PersonDetail.css';

export default function PersonDetail() {
    return (
        <section className="person-detail">
            <div className="person-avatar">
                JD
            </div>

            <div className="person-info">
                <h2>John Doe</h2>
                <p className="person-role">
                    Software Engineer
                </p>

                <div className="person-divider"></div>

                <div className="person-field">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">John Doe</span>
                </div>

                <div className="person-field">
                    <span className="field-label">Role</span>
                    <span className="field-value">
                        Software Engineer
                    </span>
                </div>

                <div className="person-field">
                    <span className="field-label">Department</span>
                    <span className="field-value">
                        Information Technology
                    </span>
                </div>

                <div className="person-field">
                    <span className="field-label">Status</span>
                    <span className="status-active">
                        Active
                    </span>
                </div>
            </div>
        </section>
    );
}
