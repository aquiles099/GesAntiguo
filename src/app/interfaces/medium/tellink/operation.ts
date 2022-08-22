export interface Operation
{
    id: number;
    action: number;
    type: number;
    panel_id: number;
    contract_id: number;
    status_flag: number;
    date: string;
    digital_output_number: number;
    status_digital_output1: number;
    status_digital_output2: number;
    text: string;
    voltage1: number;
    voltage2: number;
    voltage3: number;
    current1: number;
    current2: number;
    current3: number;
    active_power: number;
    reactive_power: number;
    apparent_power: number;
    power_factor: number;
    absolute_active_energy: number;
    absolute_reactive_energy: number;
    measure_date: string;
    status_digital_output3: number;
    status_digital_output4: number;
    user: string;
    user_id: number;
    user_permissions: number;
}