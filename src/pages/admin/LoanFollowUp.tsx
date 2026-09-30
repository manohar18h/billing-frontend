import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

type TabType = "PENDING" | "TODAY" | "RETRY" | "UPCOMING";
type SearchType = "BILL" | "PHONE";

type CallResultType =
  | "ANSWERED"
  | "CUSTOMER_WILL_VISIT"
  | "CUSTOMER_REQUESTED_CALLBACK"
  | "NO_ANSWER"
  | "BUSY"
  | "NOT_CONNECTED"
  | "SWITCHED_OFF"
  | "ANSWERED_BY_OTHER"
  | "WRONG_NUMBER"
  | "OTHER";

interface PendingLoanItem {
  loanId: number;
  loanBillId: number | null;
  loanBillNumber: string | null;
  loanDate: string | null;
  metal: string | null;
  itemName: string | null;
  grossWeight: number | null;
  netWeight: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  dueAmount: number | null;
  paidInterestAmount: number | null;
  dueInterestAmount: number | null;
  deliveryStatus: string | null;
}

interface FollowUpCustomer {
  customerLoanId: number;
  customerName: string;
  phoneNumber: string;
  village: string | null;

  pendingItemCount: number;

  totalAmount: number;
  paidAmount: number;
  dueAmount: number;

  paidInterestAmount: number;
  dueInterestAmount: number;

  oldestPendingLoanDate: string | null;

  followUpStatus: string | null;
  lastCallResult: string | null;
  nextFollowUpDate: string | null;

  callCount: number;

  pendingItems: PendingLoanItem[];
}

interface SearchResult {
  customerLoanId: number;
  customerName: string;
  phoneNumber: string;
  village: string | null;

  searchedBillNumber: string | null;
  searchedBillId: number | null;

  totalBills: number;
  totalItems: number;
  pendingItems: number;
  deliveredItems: number;

  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;

  followUpStatus: string | null;
  lastCallResult: string | null;
  nextFollowUpDate: string | null;
  callCount: number;

  bills: any[];
  paymentHistory: any[];
  callHistory: any[];
}

const LoanFollowUp: React.FC = () => {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState<TabType>("PENDING");

  const [pending, setPending] = useState<FollowUpCustomer[]>([]);
  const [today, setToday] = useState<FollowUpCustomer[]>([]);
  const [retry, setRetry] = useState<FollowUpCustomer[]>([]);
  const [upcoming, setUpcoming] = useState<FollowUpCustomer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchType, setSearchType] =
    useState<SearchType>("BILL");

  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);

  const [searchResult, setSearchResult] =
    useState<SearchResult | null>(null);

  const [searchError, setSearchError] = useState("");

  const [callCustomer, setCallCustomer] =
  useState<FollowUpCustomer | null>(null);

const [callResult, setCallResult] =
  useState<CallResultType | "">("");

const [nextFollowUpDate, setNextFollowUpDate] =
  useState("");

const [callNote, setCallNote] =
  useState("");

const [savingCall, setSavingCall] =
  useState(false);

const [callError, setCallError] =
  useState("");

const [callSuccess, setCallSuccess] =
  useState("");

  const [transactionItem, setTransactionItem] =
  useState<any | null>(null);

const [transactions, setTransactions] =
  useState<any[]>([]);

const [loadingTransactions, setLoadingTransactions] =
  useState(false);

const [transactionError, setTransactionError] =
  useState("");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadFollowUps = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const [
        pendingResponse,
        todayResponse,
        retryResponse,
        upcomingResponse,
      ] = await Promise.all([
        api.get(
          "/sales/loan-followup/pending",
          authConfig
        ),

        api.get(
          "/sales/loan-followup/reminders/today",
          authConfig
        ),

        api.get(
          "/sales/loan-followup/retry",
          authConfig
        ),

        api.get(
          "/sales/loan-followup/reminders/upcoming",
          authConfig
        ),
      ]);

      setPending(
        Array.isArray(pendingResponse.data)
          ? pendingResponse.data
          : []
      );

      setToday(
        Array.isArray(todayResponse.data)
          ? todayResponse.data
          : []
      );

      setRetry(
        Array.isArray(retryResponse.data)
          ? retryResponse.data
          : []
      );

      setUpcoming(
        Array.isArray(upcomingResponse.data)
          ? upcomingResponse.data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load loan follow-ups",
        err
      );

      setError(
        "Unable to load loan follow-up data."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (role !== "SALES" || !token) {
      return;
    }

    loadFollowUps();
  }, [role, token, loadFollowUps]);

  const handleSearch = async () => {
    const value = searchValue.trim();

    if (!value) {
      setSearchError(
        searchType === "BILL"
          ? "Enter loan bill number."
          : "Enter phone number."
      );

      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setSearchResult(null);

      let url = "";

      if (searchType === "BILL") {
        url =
          "/sales/loan-followup/search/bill/" +
          encodeURIComponent(value);
      } else {
        url =
          "/sales/loan-followup/search/phone/" +
          encodeURIComponent(value);
      }

      const response = await api.get(
        url,
        authConfig
      );

      setSearchResult(response.data as SearchResult);
    } catch (err: any) {
      console.error(
        "Loan follow-up search failed",
        err
      );

      setSearchError(
        err?.response?.data?.message ||
          "No matching loan customer found."
      );
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setSearchResult(null);
    setSearchError("");
  };

  const formatMoney = (
    value: number | null | undefined
  ) => {
    return `₹${Math.round(
      Number(value || 0)
    ).toLocaleString("en-IN")}`;
  };

  const formatDate = (
    value: string | null | undefined
  ) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const openCallDialog = (customer: FollowUpCustomer) => {
  setCallCustomer(customer);

  setCallResult("");

  setNextFollowUpDate("");

  setCallNote("");

  setCallError("");

  setCallSuccess("");
};

const closeCallDialog = () => {
  if (savingCall) return;

  setCallCustomer(null);

  setCallResult("");

  setNextFollowUpDate("");

  setCallNote("");

  setCallError("");

  setCallSuccess("");
};

const setQuickFollowUpDate = (days: number) => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  setNextFollowUpDate(
    `${year}-${month}-${day}`
  );
};

const requiresReminderDate =
  callResult === "ANSWERED" ||
  callResult === "CUSTOMER_WILL_VISIT" ||
  callResult === "CUSTOMER_REQUESTED_CALLBACK";

  const saveCallResult = async () => {
  if (!callCustomer) {
    return;
  }

  if (!callResult) {
    setCallError(
      "Please select the call result."
    );

    return;
  }

  if (
    requiresReminderDate &&
    !nextFollowUpDate
  ) {
    setCallError(
      "Please select the reminder date."
    );

    return;
  }

  try {
    setSavingCall(true);

    setCallError("");

    setCallSuccess("");

    const oldestPendingItem =
      callCustomer.pendingItems?.[0];

    await api.post(
      "/sales/loan-followup/call-result",
      {
        customerLoanId:
          callCustomer.customerLoanId,

        loanBillId:
          oldestPendingItem?.loanBillId ??
          null,

        callResult,

        nextFollowUpDate:
          nextFollowUpDate || null,

        note:
          callNote.trim() || null,
      },
      authConfig
    );

    setCallSuccess(
      "Call result saved successfully."
    );

    /*
     * Refresh all four lists.
     *
     * This automatically updates:
     *
     * Pending
     * Today's Reminders
     * Retry
     * Upcoming
     *
     * and therefore also updates
     * the counts shown at the top.
     */
    await loadFollowUps();

    /*
     * Keep success message visible
     * briefly before closing.
     */
   setTimeout(() => {
  setCallCustomer(null);
  setCallResult("");
  setNextFollowUpDate("");
  setCallNote("");
  setCallError("");
  setCallSuccess("");
}, 700);
  } catch (err: any) {
    console.error(
      "Failed to save call result",
      err
    );

    setCallError(
      err?.response?.data?.message ||
        err?.response?.data ||
        "Unable to save call result."
    );
  } finally {
    setSavingCall(false);
  }
};


const getTodayInputDate = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const openTransactions = async (
  item: any,
  billNumber?: string | null
) => {
  if (!item?.loanId) {
    return;
  }

  setTransactionItem({
    ...item,
    loanBillNumber:
      billNumber || item.loanBillNumber || null,
  });

  setTransactions([]);
  setTransactionError("");
  setLoadingTransactions(true);

  try {
    const response = await api.get(
      `/sales/loan-followup/item/${item.loanId}/transactions`,
      authConfig
    );

    setTransactions(
      Array.isArray(response.data)
        ? response.data
        : []
    );
  } catch (err: any) {
    console.error(
      "Failed to load item transactions",
      err
    );

    setTransactionError(
      err?.response?.data?.message ||
        "Unable to load transactions."
    );
  } finally {
    setLoadingTransactions(false);
  }
};

const closeTransactions = () => {
  setTransactionItem(null);
  setTransactions([]);
  setTransactionError("");
  setLoadingTransactions(false);
};

  const currentList = (): FollowUpCustomer[] => {
    switch (activeTab) {
      case "TODAY":
        return today;

      case "RETRY":
        return retry;

      case "UPCOMING":
        return upcoming;

      default:
        return pending;
    }
  };

  if (role !== "SALES") {
    return (
      <div className="p-10 text-center font-bold text-red-600">
        Access Denied
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7ed] via-white to-[#f4f0ff] p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 rounded-xl bg-gray-950 px-5 py-3 font-bold text-white transition hover:bg-gray-800"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-6 rounded-[28px] bg-gradient-to-r from-gray-950 via-gray-900 to-amber-800 p-6 text-white shadow-xl md:p-8">

          <p className="text-sm font-semibold text-amber-200">
            HAMBIRE JEWELLERY
          </p>

          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
            Loan Follow-up
          </h1>

          <p className="mt-2 text-white/70">
            Pending loans, reminders, retry calls and
            customer follow-ups.
          </p>

        </div>

        {/* SEARCH */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-lg md:p-6">

          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-gray-900">
              Search Customer / Loan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search using loan bill number or customer
              phone number.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto_auto]">

            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(
                  e.target.value as SearchType
                );

                setSearchResult(null);
                setSearchError("");
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-amber-500"
            >
              <option value="BILL">
                Bill Number
              </option>

              <option value="PHONE">
                Phone Number
              </option>
            </select>

            <input
              type="text"
              value={searchValue}
              onChange={(e) =>
                setSearchValue(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder={
                searchType === "BILL"
                  ? "Example: L-002 or 002"
                  : "Enter phone number"
              }
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-500"
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="rounded-xl bg-amber-600 px-6 py-3 font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {searching
                ? "Searching..."
                : "Search"}
            </button>

            {(searchResult || searchValue) && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
              >
                Clear
              </button>
            )}

          </div>

          {searchError && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {searchError}
            </div>
          )}

        </div>

        {/* SEARCH RESULT */}
        {searchResult && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-lg md:p-6">

            <div className="flex flex-col justify-between gap-3 md:flex-row">

              <div>
                <div className="text-sm font-bold uppercase text-amber-600">
                  Search Result
                </div>

                <h2 className="mt-1 text-2xl font-extrabold">
                  {searchResult.customerName}
                </h2>

                <div className="mt-1 text-gray-500">
                  {searchResult.village || "-"}
                </div>
              </div>

              <a
                href={`tel:${searchResult.phoneNumber}`}
                className="self-start rounded-xl bg-green-600 px-5 py-3 font-bold text-white"
              >
                📞 {searchResult.phoneNumber}
              </a>

            </div>

            {searchResult.searchedBillNumber && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4">
                <span className="text-sm text-gray-500">
                  Searched Bill
                </span>

                <div className="text-lg font-extrabold text-amber-800">
                  {searchResult.searchedBillNumber}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

              <SummaryBox
                label="Total Bills"
                value={searchResult.totalBills}
              />

              <SummaryBox
                label="Total Items"
                value={searchResult.totalItems}
              />

              <SummaryBox
                label="Pending Items"
                value={searchResult.pendingItems}
              />

              <SummaryBox
                label="Delivered"
                value={searchResult.deliveredItems}
              />

            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">

              <MoneyBox
                label="Principal Due"
                value={formatMoney(
                  searchResult.dueAmount
                )}
              />

              <MoneyBox
                label="Interest Due"
                value={formatMoney(
                  searchResult.dueInterestAmount
                )}
              />

              <MoneyBox
                label="Total Paid"
                value={formatMoney(
                  searchResult.paidAmount
                )}
              />

            </div>

            <div className="mt-5 flex flex-wrap gap-2">

              {searchResult.followUpStatus && (
                <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
                  {searchResult.followUpStatus}
                </span>
              )}

              {searchResult.nextFollowUpDate && (
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                  Next:{" "}
                  {formatDate(
                    searchResult.nextFollowUpDate
                  )}
                </span>
              )}

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700">
                Calls: {searchResult.callCount || 0}
              </span>

            </div>

            {/* Bills */}
            <div className="mt-6">

              <h3 className="mb-3 text-lg font-extrabold">
                Loan Bills
              </h3>

              <div className="space-y-3">
                {(searchResult.bills || []).map(
                  (bill: any) => (
                    <div
                      key={bill.loanBillId}
                      className="rounded-2xl border border-gray-200 p-4"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-2">

                        <div className="font-extrabold text-violet-700">
                          {bill.loanBillNumber}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            String(
                              bill.deliveryStatus
                            ).toLowerCase() ===
                            "pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {bill.deliveryStatus}
                        </span>

                      </div>

                      <div className="mt-2 text-sm text-gray-500">
                        Billing Date:{" "}
                        {bill.loanBillingDate || "-"}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">

                        <SmallMoney
                          label="Total"
                          value={formatMoney(
                            bill.totalAmount
                          )}
                        />

                        <SmallMoney
                          label="Paid"
                          value={formatMoney(
                            bill.paidAmount
                          )}
                        />

                        <SmallMoney
                          label="Due"
                          value={formatMoney(
                            bill.dueAmount
                          )}
                        />

                        <SmallMoney
                          label="Interest Due"
                          value={formatMoney(
                            bill.dueInterestAmount
                          )}
                        />

                      </div>

                    {(bill.selectedItems || []).map(
  (item: any) => (
    <div
      key={item.loanId}
      className="mt-3 rounded-xl bg-gray-50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="font-bold text-gray-900">
            {item.itemName || "-"}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {item.metal || "-"} • Gross{" "}
            {item.gross_weight ?? 0} g • Net{" "}
            {item.net_weight ?? 0} g
          </div>

          <div className="mt-1 text-xs font-semibold text-gray-400">
            Loan Item #{item.loanId}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            openTransactions(
              item,
              bill.loanBillNumber
            )
          }
          className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-200"
        >
          View Transactions
        </button>

      </div>
    </div>
  )
)}

                    </div>
                  )
                )}
              </div>

            </div>

         

            {/* Call History */}
            <div className="mt-6">

              <h3 className="mb-3 text-lg font-extrabold">
                Sales Call History
              </h3>

              {searchResult.callHistory?.length ? (
                <div className="space-y-2">
                  {searchResult.callHistory.map(
                    (call: any) => (
                      <div
                        key={call.historyId}
                        className="rounded-xl bg-violet-50 p-4"
                      >
                        <div className="font-bold text-violet-800">
                          {formatCallResult(
                            call.callResult
                          )}
                        </div>

                        <div className="mt-1 text-sm text-gray-600">
                          {call.calledAt}
                        </div>

                        {call.note && (
                          <div className="mt-2 text-sm">
                            {call.note}
                          </div>
                        )}

                        {call.nextFollowUpDate && (
                          <div className="mt-2 text-sm font-semibold text-blue-700">
                            Next follow-up:{" "}
                            {formatDate(
                              call.nextFollowUpDate
                            )}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          Called by:{" "}
                          {call.calledBy || "-"}
                        </div>

                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyText text="No sales call history" />
              )}

            </div>

          </div>
        )}

        {/* COUNTS */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <CountCard
            label="Pending"
            value={pending.length}
            active={activeTab === "PENDING"}
            onClick={() =>
              setActiveTab("PENDING")
            }
          />

          <CountCard
            label="Today's Reminders"
            value={today.length}
            active={activeTab === "TODAY"}
            onClick={() =>
              setActiveTab("TODAY")
            }
          />

          <CountCard
            label="Retry"
            value={retry.length}
            active={activeTab === "RETRY"}
            onClick={() =>
              setActiveTab("RETRY")
            }
          />

          <CountCard
            label="Upcoming"
            value={upcoming.length}
            active={activeTab === "UPCOMING"}
            onClick={() =>
              setActiveTab("UPCOMING")
            }
          />

        </div>

        {/* QUEUE */}
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg md:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-2xl font-extrabold">
                {getTabTitle(activeTab)}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Oldest pending loan first
              </p>
            </div>

            <button
              type="button"
              onClick={loadFollowUps}
              className="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200"
            >
              ↻ Refresh
            </button>

          </div>

          {loading ? (
            <div className="py-12 text-center font-semibold text-gray-500">
              Loading loan follow-ups...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">
              {error}
            </div>
          ) : currentList().length === 0 ? (
            <div className="rounded-2xl bg-gray-50 py-12 text-center text-gray-500">
              No customers in this section.
            </div>
          ) : (
            <div className="space-y-4">

              {currentList().map((customer) => (

                <div
                  key={customer.customerLoanId}
                  className="rounded-2xl border border-gray-200 p-4 transition hover:shadow-md md:p-5"
                >

                  <div className="flex flex-col justify-between gap-4 md:flex-row">

                    <div>

                      <h3 className="text-xl font-extrabold text-gray-900">
                        {customer.customerName}
                      </h3>

                      <div className="mt-1 text-sm text-gray-500">
                        {customer.village || "-"}
                      </div>

                      <a
                        href={`tel:${customer.phoneNumber}`}
                        className="mt-2 inline-block font-bold text-green-700"
                      >
                        📞 {customer.phoneNumber}
                      </a>

                    </div>

                    <div className="flex flex-wrap items-start gap-2">

                      {customer.followUpStatus && (
                        <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
                          {customer.followUpStatus}
                        </span>
                      )}

                      {customer.nextFollowUpDate && (
                        <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                          {formatDate(
                            customer.nextFollowUpDate
                          )}
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

                    <InfoBox
                      label="Pending Items"
                      value={
                        customer.pendingItemCount
                      }
                    />

                    <InfoBox
                      label="Oldest Loan"
                      value={formatDate(
                        customer.oldestPendingLoanDate
                      )}
                    />

                    <InfoBox
                      label="Principal Due"
                      value={formatMoney(
                        customer.dueAmount
                      )}
                    />

                    <InfoBox
                      label="Interest Due"
                      value={formatMoney(
                        customer.dueInterestAmount
                      )}
                    />

                  </div>

                  {/* Items */}
                  <div className="mt-4 space-y-2">

                    {customer.pendingItems?.map(
                      (item) => (

                        <div
                          key={item.loanId}
                          className="rounded-xl bg-gray-50 p-3"
                        >

                          <div className="flex flex-wrap justify-between gap-2">

                            <div>

                              <div className="font-bold">
                                {item.itemName || "-"}
                              </div>

                              <div className="text-sm text-gray-500">
                                {item.loanBillNumber ||
                                  "-"}{" "}
                                • {item.metal || "-"}
                              </div>

                            </div>

                            <div className="text-right">

                              <div className="font-bold text-orange-700">
                                {formatMoney(
                                  item.dueAmount
                                )}
                              </div>

                              <div className="text-xs text-gray-500">
                                Due
                              </div>

                            </div>

                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            Loan:{" "}
                            {formatDate(
                              item.loanDate
                            )}{" "}
                            • Gross{" "}
                            {item.grossWeight ?? 0} g •
                            Net{" "}
                            {item.netWeight ?? 0} g
                          </div>

                        </div>
                      )
                    )}

                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("PHONE");
                        setSearchValue(
                          customer.phoneNumber
                        );

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });

                        setTimeout(() => {
                          searchCustomerByPhone(
                            customer.phoneNumber,
                            token,
                            setSearching,
                            setSearchResult,
                            setSearchError
                          );
                        }, 100);
                      }}
                      className="rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
                    >
                      View Full History
                    </button>

                   <button
  type="button"
  onClick={() =>
    openCallDialog(customer)
  }
  className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
>
  📞 Call Customer
</button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      {callCustomer && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
    onClick={closeCallDialog}
  >
    <div
      className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl md:max-w-2xl md:rounded-[28px] md:p-7"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase text-green-600">
            Loan Follow-up
          </div>

          <h2 className="mt-1 text-2xl font-extrabold text-gray-950">
            Record Call Result
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Save the result after speaking
            with the customer.
          </p>
        </div>

        <button
          type="button"
          onClick={closeCallDialog}
          disabled={savingCall}
          className="rounded-full bg-gray-100 px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* CUSTOMER */}

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <div className="text-xl font-extrabold text-gray-950">
          {callCustomer.customerName}
        </div>

        <div className="mt-1 text-sm text-gray-500">
          {callCustomer.village || "-"}
        </div>

        <a
          href={`tel:${callCustomer.phoneNumber}`}
          className="mt-2 inline-block font-extrabold text-green-700"
        >
          📞 {callCustomer.phoneNumber}
        </a>
      </div>

      {/* CURRENT LOAN */}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryBox
          label="Pending Items"
          value={
            callCustomer.pendingItemCount
          }
        />

        <SummaryBox
          label="Calls"
          value={
            callCustomer.callCount || 0
          }
        />

        <MoneyBox
          label="Principal Due"
          value={formatMoney(
            callCustomer.dueAmount
          )}
        />

        <MoneyBox
          label="Interest Due"
          value={formatMoney(
            callCustomer.dueInterestAmount
          )}
        />
      </div>

      {/* RESULT */}

      <div className="mt-6">
        <label className="mb-2 block font-extrabold text-gray-900">
          Call Result *
        </label>

        <select
          value={callResult}
         onChange={(e) => {
  const value =
    e.target.value as
      | CallResultType
      | "";

  setCallResult(value);
  setCallError("");
}}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-500"
        >
          <option value="">
            Select call result
          </option>

          <option value="ANSWERED">
            Customer Answered — Needs Time
          </option>

          <option value="CUSTOMER_WILL_VISIT">
            Customer Will Visit
          </option>

          <option value="CUSTOMER_REQUESTED_CALLBACK">
            Customer Requested Callback
          </option>

          <option value="NO_ANSWER">
            No Answer
          </option>

          <option value="BUSY">
            Busy
          </option>

          <option value="NOT_CONNECTED">
            Not Connected
          </option>

          <option value="SWITCHED_OFF">
            Switched Off
          </option>

          <option value="ANSWERED_BY_OTHER">
            Someone Else Answered
          </option>

          <option value="WRONG_NUMBER">
            Wrong Number
          </option>

          <option value="OTHER">
            Other
          </option>
        </select>
      </div>

      {/* REMINDER DATE */}

      {requiresReminderDate && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <label className="block font-extrabold text-gray-900">
            Reminder Date *
          </label>

          <p className="mt-1 text-sm text-gray-500">
            When should Sales call this
            customer again?
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setQuickFollowUpDate(1)
              }
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-gray-50"
            >
              Tomorrow
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickFollowUpDate(3)
              }
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-gray-50"
            >
              +3 Days
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickFollowUpDate(5)
              }
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-gray-50"
            >
              +5 Days
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickFollowUpDate(7)
              }
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-gray-50"
            >
              +7 Days
            </button>
          </div>

         <input
  type="date"
  value={nextFollowUpDate}
  min={getTodayInputDate()}
  onChange={(e) =>
    setNextFollowUpDate(
      e.target.value
    )
  }
  className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-blue-500"
/>

          {nextFollowUpDate && (
            <div className="mt-2 text-sm font-bold text-blue-700">
              Reminder:{" "}
              {formatDate(
                nextFollowUpDate
              )}
            </div>
          )}
        </div>
      )}

      {/* RETRY DATE */}

      {callResult &&
        !requiresReminderDate && (
          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <label className="block font-extrabold text-gray-900">
              Retry Date
            </label>

            <p className="mt-1 text-sm text-gray-500">
              Optional. If you don't select
              a date, the backend will use
              its default retry date.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setQuickFollowUpDate(1)
                }
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm"
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuickFollowUpDate(3)
                }
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm"
              >
                +3 Days
              </button>
            </div>

            <input
              type="date"
              value={nextFollowUpDate}
              min={getTodayInputDate()}
              onChange={(e) =>
                setNextFollowUpDate(
                  e.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </div>
        )}

      {/* NOTE */}

      <div className="mt-5">
        <label className="mb-2 block font-extrabold text-gray-900">
          Call Note
        </label>

        <textarea
          value={callNote}
          onChange={(e) =>
            setCallNote(e.target.value)
          }
          rows={3}
          placeholder="Example: Customer asked to call after 5 days..."
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-500"
        />
      </div>

      {/* ERROR */}

      {callError && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
          {callError}
        </div>
      )}

      {/* SUCCESS */}

      {callSuccess && (
        <div className="mt-4 rounded-xl bg-green-50 p-3 font-semibold text-green-700">
          ✓ {callSuccess}
        </div>
      )}

      {/* ACTIONS */}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={closeCallDialog}
          disabled={savingCall}
          className="rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveCallResult}
          disabled={
            savingCall ||
            !callResult
          }
          className="rounded-xl bg-green-600 px-6 py-3 font-extrabold text-white shadow-lg transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingCall
            ? "Saving..."
            : "✓ Save Call Result"}
        </button>
      </div>


    </div>

    
  </div>
)}

{transactionItem && (
  <div
    className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
    onClick={closeTransactions}
  >
    <div
      className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl md:max-w-2xl md:rounded-[28px] md:p-7"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase text-emerald-600">
            Loan Item
          </div>

          <h2 className="mt-1 text-2xl font-extrabold text-gray-950">
            Transaction History
          </h2>
        </div>

        <button
          type="button"
          onClick={closeTransactions}
          className="rounded-full bg-gray-100 px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>

      {/* ITEM DETAILS */}
      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-950">
              {transactionItem.itemName || "-"}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              {transactionItem.metal || "-"}
            </div>
          </div>

          {transactionItem.loanBillNumber && (
            <span className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-700">
              {transactionItem.loanBillNumber}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>
            Loan Item #{transactionItem.loanId}
          </span>

          <span>
            Gross:{" "}
            {transactionItem.gross_weight ??
              transactionItem.grossWeight ??
              0}{" "}
            g
          </span>

          <span>
            Net:{" "}
            {transactionItem.net_weight ??
              transactionItem.netWeight ??
              0}{" "}
            g
          </span>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="mt-6">
        <h3 className="text-lg font-extrabold text-gray-950">
          Transactions
        </h3>

        {loadingTransactions ? (
          <div className="mt-3 rounded-xl bg-gray-50 p-6 text-center font-semibold text-gray-500">
            Loading transactions...
          </div>
        ) : transactionError ? (
          <div className="mt-3 rounded-xl bg-red-50 p-4 font-semibold text-red-700">
            {transactionError}
          </div>
        ) : transactions.length === 0 ? (
          <div className="mt-3 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
            No transactions found for this loan item.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {transactions.map((transaction: any) => (
              <div
                key={transaction.amountHistoryId}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-emerald-800">
                      {transaction.paymentType || "-"}
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {transaction.paymentMethod || "-"}
                    </div>
                  </div>

                  <div className="text-lg font-extrabold text-emerald-700">
                    {formatMoney(
                      transaction.amount
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t border-emerald-100 pt-3 text-sm text-gray-600">
                  {transaction.paymentDate || "-"}
                </div>

                {transaction.description && (
                  <div className="mt-2 rounded-lg bg-white/70 p-3 text-sm text-gray-700">
                    {transaction.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CLOSE */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={closeTransactions}
          className="w-full rounded-xl bg-gray-950 px-6 py-3 font-bold text-white hover:bg-gray-800 sm:w-auto"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

const CountCard = ({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border p-4 text-left shadow-sm transition ${
      active
        ? "border-gray-900 bg-gray-900 text-white"
        : "border-gray-200 bg-white text-gray-900 hover:shadow-md"
    }`}
  >
    <div
      className={`text-sm font-bold ${
        active
          ? "text-white/70"
          : "text-gray-500"
      }`}
    >
      {label}
    </div>

    <div className="mt-1 text-3xl font-extrabold">
      {value}
    </div>
  </button>
);

const InfoBox = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl bg-gray-50 p-3">
    <div className="text-xs font-semibold text-gray-500">
      {label}
    </div>

    <div className="mt-1 font-extrabold text-gray-900">
      {value}
    </div>
  </div>
);

const SummaryBox = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl bg-gray-50 p-4">
    <div className="text-xs font-semibold text-gray-500">
      {label}
    </div>

    <div className="mt-1 text-xl font-extrabold">
      {value}
    </div>
  </div>
);

const MoneyBox = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-amber-50 p-4">
    <div className="text-xs font-semibold text-amber-700">
      {label}
    </div>

    <div className="mt-1 text-xl font-extrabold text-gray-900">
      {value}
    </div>
  </div>
);

const SmallMoney = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-lg bg-gray-50 p-2">
    <div className="text-[11px] text-gray-500">
      {label}
    </div>

    <div className="font-bold">
      {value}
    </div>
  </div>
);

const EmptyText = ({
  text,
}: {
  text: string;
}) => (
  <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
    {text}
  </div>
);

const getTabTitle = (tab: TabType) => {
  switch (tab) {
    case "TODAY":
      return "Today's Reminders";

    case "RETRY":
      return "Retry Calls";

    case "UPCOMING":
      return "Upcoming Reminders";

    default:
      return "Pending Loan Delivery";
  }
};

const formatCallResult = (
  value: string | null | undefined
) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const searchCustomerByPhone = async (
  phoneNumber: string,
  token: string | null,
  setSearching: React.Dispatch<
    React.SetStateAction<boolean>
  >,
  setSearchResult: React.Dispatch<
    React.SetStateAction<SearchResult | null>
  >,
  setSearchError: React.Dispatch<
    React.SetStateAction<string>
  >
) => {
  try {
    setSearching(true);
    setSearchError("");

    const response = await api.get(
      `/sales/loan-followup/search/phone/${encodeURIComponent(
        phoneNumber
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSearchResult(response.data as SearchResult);
  } catch (err: any) {
    console.error(
      "Failed to load customer history",
      err
    );

    setSearchError(
      err?.response?.data?.message ||
        "Unable to load customer history."
    );
  } finally {
    setSearching(false);
  }
};

export default LoanFollowUp;