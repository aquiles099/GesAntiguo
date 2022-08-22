export interface QuarterHourMeasure
{
    absolute_active_energy: number; // Energía activa consumida (kWh)
    absolute_reactive_energy: number; // Energía reactiva consumida (kVArh)
    active_energy: number; // Energía activa consumida (kWh)
    active_power: number; // Potencia activa (KW)
    apparent_power: number; // Potencia aparente (kVA)
    contract_id: number; // Id contrato
    current1: number; // Corriente fase 1 (A)
    current2: number; // Corriente fase 2 (A)
    current3: number; // Corriente fase 3 (A)
    date: string; // fecha
    panel_id: number; // id CM
    power_factor: number; // Factor de potencia
    reactive_energy: number; // Energía reactiva consumida (KVArh)
    reactive_power: number; // Potencia reactiva (kVAr)
    voltage1: number; // Tension fase 1 (V)
    voltage2: number; // Tension fase 2 (V)
    voltage3: number; // Tension fase 3 (V)
}

export interface DailyMonthlyMeasure
{
    panel_id: number; // id CM
    name: string; // nombre CM  
    contract_id: number; // Id Contrato
    date: string; // Fecha
    active_energy: number; // Energía activa consumida (kWh)
    reactive_energy: number;  // Energía reactiva consumida (KVArh)
}