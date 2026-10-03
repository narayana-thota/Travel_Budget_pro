function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    accent = "green",
}) {
    return (
        <article className={`summary-card summary-card-${accent}`}>
            <div className="summary-card-top">
                <div className="summary-card-label">
                    {title}
                </div>

                <div className="summary-card-icon">
                    <Icon size={19} strokeWidth={1.8} />
                </div>
            </div>

            <div className="summary-card-value">
                {value}
            </div>

            <div className="summary-card-subtitle">
                {subtitle}
            </div>
        </article>
    );
}

export default SummaryCard;