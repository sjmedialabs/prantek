import { mongoStore } from "./mongodb-store"

export const api = {
  clients: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("clients", { userId }, { sort: { createdAt: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("clients", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("clients", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("clients", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("clients", id)
    },
  },

  vendors: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("vendors", { userId }, { sort: { createdAt: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("vendors", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("vendors", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("vendors", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("vendors", id)
    },
  },

  items: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("items", { userId }, { sort: { createdAt: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("items", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("items", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("items", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("items", id)
    },
  },

  receipts: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("receipts", { userId }, { sort: { date: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("receipts", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("receipts", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("receipts", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("receipts", id)
    },
  },

  quotations: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("quotations", { userId }, { sort: { date: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("quotations", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("quotations", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("quotations", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("quotations", id)
    },
  },

  payments: {
    getAll: async (userId: string) => {
      return await mongoStore.getAll("payments", { userId }, { sort: { date: -1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("payments", id)
    },
    create: async (data: any) => {
      return await mongoStore.create("payments", data)
    },
    update: async (id: string, data: any) => {
      return await mongoStore.update("payments", id, data)
    },
    delete: async (id: string) => {
      return await mongoStore.delete("payments", id)
    },
  },

  subscriptionPlans: {
    getAll: async () => {
      return await mongoStore.getAll("subscriptionPlans", {}, { sort: { price: 1 } })
    },
    getById: async (id: string) => {
      return await mongoStore.getById("subscriptionPlans", id)
    },
  },
}
