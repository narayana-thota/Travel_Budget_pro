function BudgetProgress({
    percentage = 0,
    showPercentage = true,
    compact = false,
}) {
    const safePercentage = Math.min(
        Math.max(Number(percentage) || 0, 0),
        100
    );

    let status = "normal";

    if (safePercentage >= 100) {
        status = "danger";
    } else if (safePercentage >= 80) {
        status = "warning";
    }

    return (
        <div
            className={`budget-progress ${
                compact ? "budget-progress-compact" : ""
            }`}
        >
            {showPercentage && (
                <div className="budget-progress-header">
                    <span>Budget usage</span>
                    <strong>{safePercentage.toFixed(1)}%</strong>
                </div>
            )}

            <div
                className="budget-progress-track"
                aria-label={`Budget usage ${safePercentage.toFixed(1)} percent`}
            >
                <div
                    className={`budget-progress-fill ${status}`}
                    style={{
                        width: `${safePercentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

export default BudgetProgress;