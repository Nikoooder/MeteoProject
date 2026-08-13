import { Link } from "react-router-dom";
import "./EcoMonitorButton.css";

interface Props {
    variant?: "default" | "floating";
}

function EcoMonitorButton({ variant = "default" }: Props) {
    return (
        <Link
            to="/home"
            className={`eco-monitor-button ${variant === "floating" ? "eco-monitor-button-floating" : ""
                }`}
        >
            {/*<span className="eco-monitor-button-icon" aria-hidden="true">*/}
            {/*    🌱*/}
            {/*</span>*/}
            EcoMonitor
        </Link>
    );
}

export default EcoMonitorButton;
