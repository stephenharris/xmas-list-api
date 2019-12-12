export abstract class SecretsStore {
    public abstract get(key: string): Promise<string>
}