export interface CommandCenter
{
    id: number;
    name: string;
    contract_id: number;
    contract_name: string;
    measures_type: number;
    model: number;
    address: string;
    number: number;
    location: string;
    province: string;
    description: string;
    ip: string;
    tcp_port: number;
    link_address: number;
    counter_address: string;
    measure_point: number;
    automatic: number;
    automatic_start_date: string;
    on_off_schedule1: number;
    on_off_schedule1_profile: string;
    on_off_schedule1_date: string;
    on_off_schedule_send: number;
    on_off_schedule1_profile_id: number;
    provider_sim: string;
    serial_number_sim: string;
    serial_number_ucc: string;
    latitude: string;
    longitude: string;
    status_flag: number;
    observations: string;
    electric_counter: string;
    supply_code: string;
    payment_type: number;
    payment_rate: string;
    hired_potency: number;
    alarm_profile_id: number;
    alarm_send: number;
    on_off_schedule2: string;
    on_off_schedule2_profile: string;
    on_off_schedule2_profile_id: number;
    installed_potency: number;
    number_of_circuits: number;
    output1_name: string;
    output2_name: string;
    input1_name: string;
    input2_name: string;
    input3_name: string;
    input4_name: string;
    last_download: string;
    active_alarms: number;
    active_alarms1: number;
    active_alarms2: number;
    subcontract_id: number;
    on_off_schedule3: string;
    on_off_schedule3_profile: string;
    on_off_schedule3_profile_id: number;
    output3_name: string;
    input5_name: string;
    input6_name: string;
    input7_name: string;
    input8_name: string;
    automatic_gps: number;
    active_alarms3: number;
    panel_version: number;
    counter_type: number;
}