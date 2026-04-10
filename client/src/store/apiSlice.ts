import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { logout, updateTokens } from './authSlice';

// ── Base query with JWT ──────────────────────────────────────────────────────
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL || ''}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// ── Auto-refresh on 401 ──────────────────────────────────────────────────────
const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refreshToken = (api.getState() as RootState).auth.refreshToken;
      if (refreshToken) {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions
        );
        if (refreshResult.data) {
          const tokens = refreshResult.data as { accessToken: string; refreshToken: string };
          api.dispatch(updateTokens(tokens));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } else {
        api.dispatch(logout());
      }
    }

    return result;
  };

// ── API slice ────────────────────────────────────────────────────────────────
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['User', 'Wallet', 'Network', 'Joining', 'Products', 'Orders', 'Admin', 'Vendor', 'Categories'],
  endpoints: (build) => ({
    // ── Auth ──────────────────────────────────────────────────────────────
    register: build.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyOtp: build.mutation({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    forgotPasswordRequest: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password-request', method: 'POST', body }),
    }),
    forgotPasswordSubmit: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password-submit', method: 'POST', body }),
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    checkReferral: build.query<any, string>({
      query: (code) => `/auth/referral-check/${code}`,
    }),

    // ── User ──────────────────────────────────────────────────────────────
    getMe: build.query<any, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateMe: build.mutation({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),

    // ── Network ───────────────────────────────────────────────────────────
    getUpline: build.query<any[], void>({
      query: () => '/network/upline',
      providesTags: ['Network'],
    }),
    getDownline: build.query<any[], void>({
      query: () => '/network/downline',
      providesTags: ['Network'],
    }),
    getNetworkStats: build.query<any, void>({
      query: () => '/network/stats',
      providesTags: ['Network'],
    }),
    getPayoutSlots: build.query<{ cyclePosition: number; slots: any[] }, void>({
      query: () => '/network/payout-slots',
      providesTags: ['Network'],
    }),

    // ── Joining ───────────────────────────────────────────────────────────
    submitJoining: build.mutation({
      query: () => ({ url: '/joining/request', method: 'POST' }),
      invalidatesTags: ['Joining'],
    }),
    getMyJoining: build.query<any, void>({
      query: () => '/joining/my',
      providesTags: ['Joining'],
    }),
    getAllJoinings: build.query<any[], string | undefined>({
      query: (status) => `/joining/all${status ? `?status=${status}` : ''}`,
      providesTags: ['Joining'],
    }),
    approveJoining: build.mutation({
      query: (id) => ({ url: `/joining/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Joining', 'Admin', 'Wallet'],
    }),
    rejectJoining: build.mutation({
      query: ({ id, note }) => ({ url: `/joining/${id}/reject`, method: 'POST', body: { note } }),
      invalidatesTags: ['Joining'],
    }),

    // ── Wallet (4 wallets) ───────────────────────────────────────────────
    getWallet: build.query<any, void>({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),
    getTransactions: build.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => `/wallet/transactions?page=${page}&limit=${limit}`,
      providesTags: ['Wallet'],
    }),
    transferPurchaseToIncome: build.mutation({
      query: (body) => ({ url: '/wallet/transfer', method: 'POST', body }),
      invalidatesTags: ['Wallet'],
    }),

    // ── Products ──────────────────────────────────────────────────────────
    getProducts: build.query<any[], void>({
      query: () => '/products',
      providesTags: ['Products'],
    }),
    createProduct: build.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),

    // ── Orders ────────────────────────────────────────────────────────────
    placeOrder: build.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Wallet'],
    }),
    getMyOrders: build.query<any[], void>({
      query: () => '/orders/my',
      providesTags: ['Orders'],
    }),

    // ── Categories ────────────────────────────────────────────────────────
    getCategories: build.query<any[], void>({
      query: () => '/vendor/categories',
      providesTags: ['Categories'],
    }),
    createCategory: build.mutation({
      query: (body) => ({ url: '/vendor/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),

    // ── Vendor ────────────────────────────────────────────────────────────
    registerVendor: build.mutation({
      query: (body) => ({ url: '/vendor/register', method: 'POST', body }),
      invalidatesTags: ['Vendor'],
    }),
    getMyVendor: build.query<any, void>({
      query: () => '/vendor/my',
      providesTags: ['Vendor'],
    }),
    getVendorList: build.query<any, { categoryId?: string; pinCode?: string; page?: number }>({
      query: ({ categoryId, pinCode, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (categoryId) params.set('categoryId', categoryId);
        if (pinCode) params.set('pinCode', pinCode);
        return `/vendor/list?${params}`;
      },
      providesTags: ['Vendor'],
    }),
    checkVendorSlot: build.query<any, { categoryId: string; pinCode: string }>({
      query: ({ categoryId, pinCode }) =>
        `/vendor/check-slot?categoryId=${categoryId}&pinCode=${pinCode}`,
    }),
    getAllVendorsAdmin: build.query<{ vendors: any[]; totalPages: number }, { status?: string; page?: number }>({
      query: ({ status, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set('status', status);
        return `/vendor/admin/all?${params}`;
      },
      providesTags: ['Vendor'],
    }),
    approveVendor: build.mutation({
      query: (id) => ({ url: `/vendor/admin/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Vendor'],
    }),
    suspendVendor: build.mutation({
      query: (id) => ({ url: `/vendor/admin/${id}/suspend`, method: 'POST' }),
      invalidatesTags: ['Vendor'],
    }),

    // ── Admin ─────────────────────────────────────────────────────────────
    getAdminStats: build.query<any, void>({
      query: () => '/admin/stats',
      providesTags: ['Admin'],
    }),
    getAdminMembers: build.query<any, { type?: string; search?: string; page?: number }>({
      query: ({ type, search, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (type) params.set('type', type);
        if (search) params.set('search', search);
        return `/admin/members?${params}`;
      },
      providesTags: ['Admin'],
    }),
    getPayoutLog: build.query<any, { type?: string; cycle?: string; page?: number }>({
      query: ({ type, cycle, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (type) params.set('type', type);
        if (cycle) params.set('cycle', cycle);
        return `/admin/payout-log?${params}`;
      },
      providesTags: ['Admin'],
    }),
    getCompanyRevenue: build.query<any, void>({
      query: () => '/admin/company-revenue',
      providesTags: ['Admin'],
    }),
    getGstReport: build.query<any, { from?: string; to?: string }>({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `/admin/gst-report?${params}`;
      },
      providesTags: ['Admin'],
    }),
    getRevenueSplits: build.query<any, void>({
      query: () => `/admin/revenue-splits?page=1`,
      providesTags: ['Admin'],
    }),
    getCycleReport: build.query<any, void>({
      query: () => '/admin/cycle-report',
      providesTags: ['Admin'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyOtpMutation,
  useLoginMutation,
  useForgotPasswordRequestMutation,
  useForgotPasswordSubmitMutation,
  useChangePasswordMutation,
  useCheckReferralQuery,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetUplineQuery,
  useGetDownlineQuery,
  useGetNetworkStatsQuery,
  useGetPayoutSlotsQuery,
  useSubmitJoiningMutation,
  useGetMyJoiningQuery,
  useGetAllJoiningsQuery,
  useApproveJoiningMutation,
  useRejectJoiningMutation,
  useGetWalletQuery,
  useGetTransactionsQuery,
  useTransferPurchaseToIncomeMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useRegisterVendorMutation,
  useGetMyVendorQuery,
  useGetVendorListQuery,
  useCheckVendorSlotQuery,
  useGetAllVendorsAdminQuery,
  useApproveVendorMutation,
  useSuspendVendorMutation,
  useGetAdminStatsQuery,
  useGetAdminMembersQuery,
  useGetPayoutLogQuery,
  useGetCompanyRevenueQuery,
  useGetGstReportQuery,
  useGetRevenueSplitsQuery,
  useGetCycleReportQuery,
} = api;