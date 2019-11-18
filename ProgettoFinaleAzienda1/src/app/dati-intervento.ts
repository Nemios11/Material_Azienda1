export class DatiIntervento {
    worker_id: number;
    date: string;
    description: string;
    dettaglio: string = ''; //Since it is not a required field, this makes sure that it gets set even if never filled in
    price: string;
}
