// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  endpoints: {
    // Auth
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      refreshToken: '/auth/refresh-token',
    },

    // Products
    products: {
      list: '/products',
      getById: (id: string) => `/products/${id}`,
      getBySlug: (slug: string) => `/products/slug/${slug}`,
      create: '/products',
      update: (id: string) => `/products/${id}`,
      delete: (id: string) => `/products/${id}`,
      search: (query: string) => `/products/search?q=${query}`,
      byCategory: (categoryId: string) => `/products/category/${categoryId}`,
    },

    // Categories
    categories: {
      list: '/categories',
      getById: (id: string) => `/categories/${id}`,
      getBySlug: (slug: string) => `/categories/slug/${slug}`,
      create: '/categories',
      update: (id: string) => `/categories/${id}`,
      delete: (id: string) => `/categories/${id}`,
    },

    // Cart
    cart: {
      get: '/cart',
      add: '/cart/add',
      update: '/cart/update',
      remove: (itemId: string) => `/cart/remove/${itemId}`,
      clear: '/cart/clear',
    },

    // Orders
    orders: {
      list: '/orders',
      getById: (id: string) => `/orders/${id}`,
      create: '/orders/place',
      updateStatus: (id: string) => `/orders/${id}/status`,
      cancel: (id: string) => `/orders/${id}/cancel`,
      returns: '/orders/returns',
    },

    // Users
    users: {
      profile: '/users/profile',
      updateProfile: '/users/profile',
      addresses: {
        list: '/users/addresses',
        create: '/users/addresses',
        update: (id: string) => `/users/addresses/${id}`,
        delete: (id: string) => `/users/addresses/${id}`,
      },
      orders: '/users/orders',
      reviews: '/users/reviews',
    },

    // Reviews
    reviews: {
      list: '/reviews',
      create: '/reviews',
      getById: (id: string) => `/reviews/${id}`,
      update: (id: string) => `/reviews/${id}`,
      delete: (id: string) => `/reviews/${id}`,
      byProduct: (productId: string) => `/reviews/product/${productId}`,
    },

    // Admin
    admin: {
      dashboard: '/admin/dashboard',
      stats: '/admin/stats',
      salesReport: '/admin/sales-report',
      products: {
        list: '/admin/products',
        create: '/admin/products',
        update: (id: string) => `/admin/products/${id}`,
        delete: (id: string) => `/admin/products/${id}`,
        toggleStatus: (id: string) => `/admin/products/${id}/toggle`,
      },
      categories: {
        list: '/admin/categories',
        create: '/admin/categories',
        update: (id: string) => `/admin/categories/${id}`,
        delete: (id: string) => `/admin/categories/${id}`,
      },
      orders: {
        list: '/admin/orders',
        getById: (id: string) => `/admin/orders/${id}`,
        updateStatus: (id: string) => `/admin/orders/${id}/status`,
        cancel: (id: string) => `/admin/orders/${id}/cancel`,
      },
      users: {
        list: '/admin/users',
        getById: (id: string) => `/admin/users/${id}`,
        toggleStatus: (id: string) => `/admin/users/${id}/toggle`,
      },
      reviews: {
        pending: '/admin/reviews/pending',
        approve: (id: string) => `/admin/reviews/${id}/approve`,
        reject: (id: string) => `/admin/reviews/${id}/reject`,
      },
      export: {
        pdf: '/admin/export/pdf',
        excel: '/admin/export/excel',
      },
    },
  },
};
