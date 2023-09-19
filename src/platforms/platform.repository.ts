import { Config } from "src/user/user.entity";

export interface IFindParams {
    config: Config;
    lastViewed: Date;
}

export interface Car {
    price: number;
    brand: string;
    link: string;
    photo: string;
}

export abstract class PlatformRepository {
    abstract find(params: IFindParams): Promise<Car[]>;
}