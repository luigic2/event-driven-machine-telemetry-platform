import './MachineStatus.css';
import { Button } from '@/shared/components/Button'

export default function MachineStatus() {
    return(
        
        <div className="machine-status">
            <h2>Machine Status</h2>
            <div id='machine-info'>
                <p>Current status: Running</p>
                <p>Last Maintenance: 2023-10-15</p>
                <p>Alerts: None</p>
                <Button onClick={() => alert('More details clicked!')}>More Details</Button> 
            </div>
        </div>
    )
}