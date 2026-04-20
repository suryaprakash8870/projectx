import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl } from './config';

// The shared slice is platform-agnostic. Consumers must provide:
//   - a selector to read the access token from root state
//   - a selector to read the refresh token from root state
//   - the updateTokens and logout action creators
// This lets the web and mobile apps both mount this slice into their own store.

export interface ApiSliceDeps {
  getAccessToken: (state: any) => string | null;
  getRefreshToken: (state: any) => string | null;
  updateTokens: (payload: { accessToken: string; refreshToken: string }) => any;
  logout: () => any;
}

let deps: ApiSliceDeps | null = null;

export function setApiDeps(d: ApiSliceDeps) {
  deps = d;
}

function requireDeps(): ApiSliceDeps {
  if (!deps) {
    throw new Error(
      '[shared/apiSlice] setApiDeps(...) must be called at bootstrap before the store is used.'
    );
  }
  return deps;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: (headers, { getState }) => {
    const token = requireDeps().getAccessToken(getState());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Injects the base URL late so platforms can set it after module load.
const dynamicBase: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const base = `${getApiBaseUrl()}/api`;
  const adjusted =
    typeof args === 'string'
      ? `${base}${args}`
      : { ...args, url: `${base}${args.url}` };
  return rawBaseQuery(adjusted as any, api, extraOptions);
};

function logRequest(args: string | FetchArgs) {
  const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
  const url = typeof args === 'string' ? args : args.url;
  console.log(`[API] → ${method} ${getApiBaseUrl()}/api${url}`);
}

function logResult(args: string | FetchArgs, result: { error?: any; data?: any }) {
  const url = typeof args === 'string' ? args : args.url;
  if (result.error) {
    console.warn(`[API] ✗ ${url}`, {
      status: result.error.status,
      data: result.error.data,
      error: result.error.error,
    });
  } else {
    console.log(`[API] ✓ ${url}`);
  }
}

const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    logRequest(args);
    let result = await dynamicBase(args, api, extraOptions);
    logResult(args, result);

    if (result.error?.status === 401) {
      const { getRefreshToken, updateTokens, logout } = requireDeps();
      const refreshToken = getRefreshToken(api.getState());
      if (refreshToken) {
        console.log('[API] 401 — attempting token refresh');
        const refreshResult = await dynamicBase(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions
        );
        if (refreshResult.data) {
          const tokens = refreshResult.data as { accessToken: string; refreshToken: string };
          api.dispatch(updateTokens(tokens));
          result = await dynamicBase(args, api, extraOptions);
          logResult(args, result);
        } else {
          console.warn('[API] refresh failed — logging out');
          api.dispatch(logout());
        }
      } else {
        console.warn('[API] 401 with no refresh token — logging out');
        api.dispatch(logout());
      }
    }

    return result;
  };

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: [
    'User', 'Wallet', 'Network', 'Joining', 'Products', 'Orders',
    'Admin', 'Vendor', 'Categories', 'Plan1Sub', 'Plan2', 'Plan2Admin',
  ],
  endpoints: (build) => ({
    // ── Auth ──────────────────────────────────────────────────────────────
    register: build.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    verifyOtp: build.mutation({ query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }) }),
    login: build.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    forgotPasswordRequest: build.mutation({ query: (body) => ({ url: '/auth/forgot-password-request', method: 'POST', body }) }),
    forgotPasswordSubmit: build.mutation({ query: (body) => ({ url: '/auth/forgot-password-submit', method: 'POST', body }) }),
    changePassword: build.mutation({ query: (body) => ({ url: '/auth/change-password', method: 'POST', body }) }),
    checkReferral: build.query<any, string>({ query: (code) => `/auth/referral-check/${code}` }),

    // ── User ──────────────────────────────────────────────────────────────
    getMe: build.query<any, void>({ query: () => '/users/me', providesTags: ['User'] }),
    updateMe: build.mutation({ query: (body) => ({ url: '/users/me', method: 'PUT', body }), invalidatesTags: ['User'] }),

    // ── Network ───────────────────────────────────────────────────────────
    getUpline: build.query<any[], void>({ query: () => '/network/upline', providesTags: ['Network'] }),
    getDownline: build.query<any[], void>({ query: () => '/network/downline', providesTags: ['Network'] }),
    getNetworkStats: build.query<any, void>({ query: () => '/network/stats', providesTags: ['Network'] }),
    getPayoutSlots: build.query<{ cyclePosition: number; slots: any[] }, void>({
      query: () => '/network/payout-slots',
      providesTags: ['Network'],
    }),

    // ── Joining ───────────────────────────────────────────────────────────
    submitJoining: build.mutation({ query: () => ({ url: '/joining/request', method: 'POST' }), invalidatesTags: ['Joining'] }),
    getMyJoining: build.query<any, void>({ query: () => '/joining/my', providesTags: ['Joining'] }),
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

    // ── Wallet ────────────────────────────────────────────────────────────
    getWallet: build.query<any, void>({ query: () => '/wallet', providesTags: ['Wallet'] }),
    getTransactions: build.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => `/wallet/transactions?page=${page}&limit=${limit}`,
      providesTags: ['Wallet'],
    }),
    transferPurchaseToIncome: build.mutation({
      query: (body) => ({ url: '/wallet/transfer', method: 'POST', body }),
      invalidatesTags: ['Wallet'],
    }),

    // ── Products ──────────────────────────────────────────────────────────
    getProducts: build.query<any[], void>({ query: () => '/products', providesTags: ['Products'] }),
    getProductDetail: build.query<any, string>({ query: (id) => `/products/${id}`, providesTags: ['Products'] }),
    createProduct: build.mutation({ query: (body) => ({ url: '/products', method: 'POST', body }), invalidatesTags: ['Products'] }),
    updateProduct: build.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: build.mutation({ query: (id: string) => ({ url: `/products/${id}`, method: 'DELETE' }), invalidatesTags: ['Products'] }),

    // ── Orders ────────────────────────────────────────────────────────────
    placeOrder: build.mutation({ query: (body) => ({ url: '/orders', method: 'POST', body }), invalidatesTags: ['Orders', 'Wallet'] }),
    getMyOrders: build.query<any[], void>({ query: () => '/orders/my', providesTags: ['Orders'] }),
    getAllOrders: build.query<any[], void>({ query: () => '/orders/all', providesTags: ['Orders'] }),
    updateOrderStatus: build.mutation({
      query: ({ id, status }) => ({ url: `/orders/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Orders'],
    }),

    // ── Categories ────────────────────────────────────────────────────────
    getCategories: build.query<any[], void>({ query: () => '/vendor/categories', providesTags: ['Categories'] }),
    createCategory: build.mutation({ query: (body) => ({ url: '/vendor/categories', method: 'POST', body }), invalidatesTags: ['Categories'] }),

    // ── Vendor ────────────────────────────────────────────────────────────
    registerVendor: build.mutation({ query: (body) => ({ url: '/vendor/register', method: 'POST', body }), invalidatesTags: ['Vendor'] }),
    getMyVendor: build.query<any, void>({ query: () => '/vendor/my', providesTags: ['Vendor'] }),
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
      query: ({ categoryId, pinCode }) => `/vendor/check-slot?categoryId=${categoryId}&pinCode=${pinCode}`,
    }),
    getAllVendorsAdmin: build.query<{ vendors: any[]; totalPages: number }, { status?: string; page?: number }>({
      query: ({ status, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set('status', status);
        return `/vendor/admin/all?${params}`;
      },
      providesTags: ['Vendor'],
    }),
    approveVendor: build.mutation({ query: (id) => ({ url: `/vendor/admin/${id}/approve`, method: 'POST' }), invalidatesTags: ['Vendor'] }),
    suspendVendor: build.mutation({ query: (id) => ({ url: `/vendor/admin/${id}/suspend`, method: 'POST' }), invalidatesTags: ['Vendor'] }),

    // ── Admin ─────────────────────────────────────────────────────────────
    getAdminStats: build.query<any, void>({ query: () => '/admin/stats', providesTags: ['Admin'] }),
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
    getCompanyRevenue: build.query<any, void>({ query: () => '/admin/company-revenue', providesTags: ['Admin'] }),
    getGstReport: build.query<any, { from?: string; to?: string }>({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `/admin/gst-report?${params}`;
      },
      providesTags: ['Admin'],
    }),
    getRevenueSplits: build.query<any, void>({ query: () => `/admin/revenue-splits?page=1`, providesTags: ['Admin'] }),
    getCycleReport: build.query<any, void>({ query: () => '/admin/cycle-report', providesTags: ['Admin'] }),

    // ── Plan 1 Subscription ──────────────────────────────────────────────
    subscribePlan1: build.mutation({ query: () => ({ url: '/plan1/subscribe', method: 'POST' }), invalidatesTags: ['Plan1Sub'] }),
    getPlan1Subscription: build.query<any, void>({ query: () => '/plan1/subscription', providesTags: ['Plan1Sub'] }),
    getPlan1AdminSubscriptions: build.query<any[], { status?: string }>({
      query: ({ status } = {}) => `/plan1/admin/subscriptions${status ? `?status=${status}` : ''}`,
      providesTags: ['Plan1Sub'],
    }),
    getPlan1AdminStats: build.query<any, void>({ query: () => '/plan1/admin/stats', providesTags: ['Plan1Sub'] }),
    approvePlan1Subscription: build.mutation<any, string>({
      query: (id) => ({ url: `/plan1/admin/subscriptions/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Plan1Sub'],
    }),
    rejectPlan1Subscription: build.mutation<any, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/plan1/admin/subscriptions/${id}/reject`, method: 'POST', body: { note } }),
      invalidatesTags: ['Plan1Sub'],
    }),

    // ── Plan 3 (investment — internal routes still /plan2) ───────────────
    plan2CheckReferral: build.query<any, string>({ query: (code) => `/plan2/auth/referral-check/${code}` }),
    plan2Register: build.mutation({ query: (body) => ({ url: '/plan2/auth/register', method: 'POST', body }) }),
    plan2VerifyOtp: build.mutation({ query: (body) => ({ url: '/plan2/auth/verify-otp', method: 'POST', body }) }),
    plan2GetMe: build.query<any, void>({ query: () => '/plan2/me', providesTags: ['Plan2'] }),
    plan2GetWallet: build.query<any, void>({ query: () => '/plan2/wallet', providesTags: ['Plan2'] }),
    plan2GetWalletTransactions: build.query<any[], void>({ query: () => '/plan2/wallet/transactions', providesTags: ['Plan2'] }),
    plan2GetMyInvestment: build.query<any, void>({ query: () => '/plan2/investment/my', providesTags: ['Plan2'] }),
    plan2SubmitInvestmentRequest: build.mutation({
      query: (body) => ({ url: '/plan2/investment/request', method: 'POST', body }),
      invalidatesTags: ['Plan2'],
    }),
    plan2GetNetworkStats: build.query<any, void>({ query: () => '/plan2/network/stats', providesTags: ['Plan2'] }),
    plan2GetDownline: build.query<any[], void>({ query: () => '/plan2/network/downline', providesTags: ['Plan2'] }),

    // ── Plan 2 Admin ─────────────────────────────────────────────────────
    plan2AdminStats: build.query<any, void>({ query: () => '/admin/plan2/stats', providesTags: ['Plan2Admin'] }),
    plan2AdminMembers: build.query<any, { search?: string; page?: number }>({
      query: ({ search, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set('search', search);
        return `/admin/plan2/members?${params}`;
      },
      providesTags: ['Plan2Admin'],
    }),
    plan2AdminInvestmentRequests: build.query<any[], string | undefined>({
      query: (status) => `/admin/plan2/investment-requests${status ? `?status=${status}` : ''}`,
      providesTags: ['Plan2Admin'],
    }),
    plan2AdminApproveInvestment: build.mutation({
      query: (id) => ({ url: `/admin/plan2/investment-requests/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Plan2Admin'],
    }),
    plan2AdminRejectInvestment: build.mutation({
      query: ({ id, note }) => ({ url: `/admin/plan2/investment-requests/${id}/reject`, method: 'POST', body: { note } }),
      invalidatesTags: ['Plan2Admin'],
    }),
    plan2AdminDistributeReturns: build.mutation({
      query: (body) => ({ url: '/admin/plan2/distribute-returns', method: 'POST', body }),
      invalidatesTags: ['Plan2Admin'],
    }),
    plan2AdminReturnRuns: build.query<any[], void>({ query: () => '/admin/plan2/return-runs', providesTags: ['Plan2Admin'] }),
    plan2AdminReturnPayouts: build.query<any, { monthKey?: string; kind?: string; page?: number }>({
      query: ({ monthKey, kind, page = 1 } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (monthKey) params.set('monthKey', monthKey);
        if (kind) params.set('kind', kind);
        return `/admin/plan2/return-payouts?${params}`;
      },
      providesTags: ['Plan2Admin'],
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
  useGetProductDetailQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
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
  useSubscribePlan1Mutation,
  useGetPlan1SubscriptionQuery,
  useGetPlan1AdminSubscriptionsQuery,
  useGetPlan1AdminStatsQuery,
  useApprovePlan1SubscriptionMutation,
  useRejectPlan1SubscriptionMutation,
  usePlan2CheckReferralQuery,
  usePlan2RegisterMutation,
  usePlan2VerifyOtpMutation,
  usePlan2GetMeQuery,
  usePlan2GetWalletQuery,
  usePlan2GetWalletTransactionsQuery,
  usePlan2GetMyInvestmentQuery,
  usePlan2SubmitInvestmentRequestMutation,
  usePlan2GetNetworkStatsQuery,
  usePlan2GetDownlineQuery,
  usePlan2AdminStatsQuery,
  usePlan2AdminMembersQuery,
  usePlan2AdminInvestmentRequestsQuery,
  usePlan2AdminApproveInvestmentMutation,
  usePlan2AdminRejectInvestmentMutation,
  usePlan2AdminDistributeReturnsMutation,
  usePlan2AdminReturnRunsQuery,
  usePlan2AdminReturnPayoutsQuery,
} = api;
