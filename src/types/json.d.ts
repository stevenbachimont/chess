declare module "*.json" {
    const value: {
        [key: string]: {
            name: string;
            steps: string[];
            description: string;
        }
    };
    export default value;
} 