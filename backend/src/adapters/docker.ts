/**
 * Docker Adapter - Integração com Docker Engine API
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    created: Date;
    ports: Array<{ private: number; public?: number }>;
    labels?: Record<string, string>;
}

export interface DockerStats {
    containerId: string;
    cpu: number;
    memory: number;
    memoryLimit: number;
    network: {
        rx: number;
        tx: number;
    };
}

export interface DockerImage {
    id: string;
    tags: string[];
    size: number;
    created: Date;
}

export class DockerAdapter {
    private client: AxiosInstance;
    private socketPath: string;

    constructor(socketPath: string = '/var/run/docker.sock') {
        this.socketPath = socketPath;

        // Cliente HTTP para Docker socket
        this.client = axios.create({
            socketPath: this.socketPath,
            baseURL: 'http://localhost',
            timeout: 30000,
        });
    }

    /**
     * Lista todos os containers
     */
    async listContainers(all: boolean = false): Promise<DockerContainer[]> {
        try {
            const response = await this.client.get('/containers/json', {
                params: { all },
            });

            return response.data.map((c: any) => ({
                id: c.Id,
                name: c.Names[0]?.replace('/', '') || 'unknown',
                image: c.Image,
                status: c.Status,
                state: c.State,
                created: new Date(c.Created * 1000),
                ports: c.Ports.map((p: any) => ({
                    private: p.PrivatePort,
                    public: p.PublicPort,
                })),
                labels: c.Labels || {},
            }));
        } catch (error: any) {
            logger.error('Erro ao listar containers:', error.message);
            throw new Error('Falha ao listar containers');
        }
    }

    /**
     * Inspeciona um container
     */
    async inspectContainer(id: string): Promise<any> {
        try {
            const response = await this.client.get(`/containers/${id}/json`);
            return response.data;
        } catch (error: any) {
            logger.error(`Erro ao inspecionar container ${id}:`, error.message);
            throw new Error('Falha ao inspecionar container');
        }
    }

    /**
     * Inicia um container
     */
    async startContainer(id: string): Promise<void> {
        try {
            await this.client.post(`/containers/${id}/start`);
            logger.info(`Container ${id} iniciado`);
        } catch (error: any) {
            logger.error(`Erro ao iniciar container ${id}:`, error.message);
            throw new Error('Falha ao iniciar container');
        }
    }

    /**
     * Para um container
     */
    async stopContainer(id: string, timeout: number = 10): Promise<void> {
        try {
            await this.client.post(`/containers/${id}/stop`, null, {
                params: { t: timeout },
            });
            logger.info(`Container ${id} parado`);
        } catch (error: any) {
            logger.error(`Erro ao parar container ${id}:`, error.message);
            throw new Error('Falha ao parar container');
        }
    }

    /**
     * Reinicia um container
     */
    async restartContainer(id: string, timeout: number = 10): Promise<void> {
        try {
            await this.client.post(`/containers/${id}/restart`, null, {
                params: { t: timeout },
            });
            logger.info(`Container ${id} reiniciado`);
        } catch (error: any) {
            logger.error(`Erro ao reiniciar container ${id}:`, error.message);
            throw new Error('Falha ao reiniciar container');
        }
    }

    /**
     * Remove um container
     */
    async removeContainer(id: string, force: boolean = false): Promise<void> {
        try {
            await this.client.delete(`/containers/${id}`, {
                params: { force },
            });
            logger.info(`Container ${id} removido`);
        } catch (error: any) {
            logger.error(`Erro ao remover container ${id}:`, error.message);
            throw new Error('Falha ao remover container');
        }
    }

    /**
     * Obtém logs de um container
     */
    async getContainerLogs(
        id: string,
        tail: number = 100
    ): Promise<string> {
        try {
            const response = await this.client.get(`/containers/${id}/logs`, {
                params: {
                    stdout: true,
                    stderr: true,
                    tail,
                },
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Erro ao obter logs do container ${id}:`, error.message);
            throw new Error('Falha ao obter logs');
        }
    }

    /**
     * Obtém estatísticas de um container
     */
    async getContainerStats(id: string): Promise<DockerStats> {
        try {
            const response = await this.client.get(`/containers/${id}/stats`, {
                params: { stream: false },
            });

            const data = response.data;
            const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage;
            const systemDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;
            const cpuPercent = (cpuDelta / systemDelta) * data.cpu_stats.online_cpus * 100;

            return {
                containerId: id,
                cpu: cpuPercent || 0,
                memory: data.memory_stats.usage || 0,
                memoryLimit: data.memory_stats.limit || 0,
                network: {
                    rx: data.networks?.eth0?.rx_bytes || 0,
                    tx: data.networks?.eth0?.tx_bytes || 0,
                },
            };
        } catch (error: any) {
            logger.error(`Erro ao obter stats do container ${id}:`, error.message);
            throw new Error('Falha ao obter estatísticas');
        }
    }

    /**
     * Cria um container
     */
    async createContainer(config: any): Promise<string> {
        try {
            const response = await this.client.post('/containers/create', config);
            const containerId = response.data.Id;
            logger.info(`Container ${containerId} criado`);
            return containerId;
        } catch (error: any) {
            logger.error('Erro ao criar container:', error.message);
            throw new Error('Falha ao criar container');
        }
    }

    /**
     * Lista imagens
     */
    async listImages(): Promise<DockerImage[]> {
        try {
            const response = await this.client.get('/images/json');
            return response.data.map((img: any) => ({
                id: img.Id,
                tags: img.RepoTags || [],
                size: img.Size,
                created: new Date(img.Created * 1000),
            }));
        } catch (error: any) {
            logger.error('Erro ao listar imagens:', error.message);
            throw new Error('Falha ao listar imagens');
        }
    }

    /**
     * Pull de uma imagem
     */
    async pullImage(image: string): Promise<void> {
        try {
            await this.client.post('/images/create', null, {
                params: { fromImage: image },
            });
            logger.info(`Imagem ${image} baixada`);
        } catch (error: any) {
            logger.error(`Erro ao baixar imagem ${image}:`, error.message);
            throw new Error('Falha ao baixar imagem');
        }
    }

    /**
     * Remove uma imagem
     */
    async removeImage(id: string, force: boolean = false): Promise<void> {
        try {
            await this.client.delete(`/images/${id}`, {
                params: { force },
            });
            logger.info(`Imagem ${id} removida`);
        } catch (error: any) {
            logger.error(`Erro ao remover imagem ${id}:`, error.message);
            throw new Error('Falha ao remover imagem');
        }
    }

    /**
     * Lista redes
     */
    async listNetworks(): Promise<any[]> {
        try {
            const response = await this.client.get('/networks');
            return response.data;
        } catch (error: any) {
            logger.error('Erro ao listar redes:', error.message);
            throw new Error('Falha ao listar redes');
        }
    }

    /**
     * Lista volumes
     */
    async listVolumes(): Promise<any[]> {
        try {
            const response = await this.client.get('/volumes');
            return response.data.Volumes || [];
        } catch (error: any) {
            logger.error('Erro ao listar volumes:', error.message);
            throw new Error('Falha ao listar volumes');
        }
    }

    /**
     * Verifica se Docker está acessível
     */
    async ping(): Promise<boolean> {
        try {
            await this.client.get('/_ping');
            return true;
        } catch (error) {
            return false;
        }
    }
}
