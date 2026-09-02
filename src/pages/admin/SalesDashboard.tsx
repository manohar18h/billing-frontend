import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";



type TaggingWork = {
  taggingWorkId: number;

  assignedTo: string;

  stockBoxId: number | null;
  stockBoxName: string;

  itemName: string;

  beforeTagCount: number;
  afterTagCount: number;

  remainingCount: number;

  remarks: string | null;

  assignedDate: string;
  completedDate: string | null;

  archived: boolean;
};


const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const token = localStorage.getItem("token");

const [taggingWorks, setTaggingWorks] =
  useState<TaggingWork[]>([]);

const [taggingLoading, setTaggingLoading] =
  useState(true);


useEffect(() => {

  if (role !== "SALES" || !token) {
    return;
  }

  const fetchTaggingWorks = async () => {

    try {

      setTaggingLoading(true);

      const response =
        await api.get<TaggingWork[]>(
          "/sales/tagging-work/active",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      setTaggingWorks(
        Array.isArray(response.data)
          ? response.data
          : [],
      );

    } catch (error) {

      console.error(
        "Failed to load RFID tagging work",
        error,
      );

      setTaggingWorks([]);

    } finally {

      setTaggingLoading(false);
    }
  };


  fetchTaggingWorks();

}, [role, token]);

  if (role !== "SALES") {
    return <div className="p-10 text-center text-red-600 font-bold">Access Denied</div>;
  }

  const totalGiven =
  taggingWorks.reduce(
    (sum, row) =>
      sum +
      Number(
        row.beforeTagCount || 0,
      ),
    0,
  );


const totalTagged =
  taggingWorks.reduce(
    (sum, row) =>
      sum +
      Number(
        row.afterTagCount || 0,
      ),
    0,
  );


const totalRemaining =
  totalGiven - totalTagged;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7ed] via-white to-[#f4f0ff] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[32px] bg-gradient-to-r from-gray-950 via-gray-900 to-amber-800 p-8 text-white shadow-2xl mb-8">
          <p className="text-sm text-amber-200 font-semibold">HAMBIRE JEWELLERY</p>
          <h1 className="text-4xl font-extrabold mt-2">Sales Dashboard</h1>
          <p className="text-white/70 mt-2">
            Quick access for sales counter, products, stock box and estimation.
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
  <Paper onClick={() => navigate("/sales/products")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">📦</div>
    <Typography variant="h6" fontWeight={800}>Products</Typography>
    <p className="text-sm text-gray-500 mt-1">Add/search products and RFID labels.</p>
  </Paper>

  <Paper onClick={() => navigate("/sales/stock-box")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">🔍</div>
    <Typography variant="h6" fontWeight={800}>Search Stock Box</Typography>
    <p className="text-sm text-gray-500 mt-1">View stock box count and weight.</p>
  </Paper>

  <Paper onClick={() => navigate("/sales/estimation")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">🧾</div>
    <Typography variant="h6" fontWeight={800}>Estimation</Typography>
    <p className="text-sm text-gray-500 mt-1">Search barcode and print estimation.</p>
  </Paper>
</div>

{/* RFID TAGGING WORK - READ ONLY */}

<div className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-lg">

  <div className="mb-5">

    <h2 className="text-2xl font-extrabold text-violet-800">
      RFID Tagging Work
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Track items assigned for RFID tagging
    </p>

  </div>


  {/* Summary */}

  <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">

    <div className="rounded-2xl bg-blue-50 p-4">

      <div className="text-sm font-semibold text-blue-600">
        Total Given
      </div>

      <div className="mt-2 text-2xl font-extrabold text-blue-800">
        {totalGiven}
      </div>

    </div>


    <div className="rounded-2xl bg-green-50 p-4">

      <div className="text-sm font-semibold text-green-600">
        Total Tagged
      </div>

      <div className="mt-2 text-2xl font-extrabold text-green-800">
        {totalTagged}
      </div>

    </div>


    <div className="rounded-2xl bg-orange-50 p-4">

      <div className="text-sm font-semibold text-orange-600">
        Remaining
      </div>

      <div className="mt-2 text-2xl font-extrabold text-orange-800">
        {totalRemaining}
      </div>

    </div>

  </div>


  {taggingLoading ? (

    <div className="py-8 text-center text-gray-500">
      Loading RFID tagging work...
    </div>

  ) : taggingWorks.length === 0 ? (

    <div className="rounded-xl bg-gray-50 py-8 text-center text-gray-500">
      No active RFID tagging work
    </div>

  ) : (

    <>

      {/* Desktop */}

      <div className="hidden overflow-x-auto md:block">

        <table className="w-full border-collapse overflow-hidden rounded-xl border border-gray-200">

          <thead className="bg-gray-100">

            <tr>

              <th className="border px-3 py-3 text-center">
                Assigned To
              </th>

              <th className="border px-3 py-3 text-center">
                Stock Box
              </th>

              <th className="border px-3 py-3 text-center">
                Item Name
              </th>

              <th className="border px-3 py-3 text-center">
                Given
              </th>

              <th className="border px-3 py-3 text-center">
                Tagged
              </th>

              <th className="border px-3 py-3 text-center">
                Remaining
              </th>

              <th className="border px-3 py-3 text-center">
                Remarks
              </th>

            </tr>

          </thead>


          <tbody>

            {taggingWorks.map((row) => {

              const remaining =
                Number(
                  row.beforeTagCount || 0,
                ) -
                Number(
                  row.afterTagCount || 0,
                );

              return (

                <tr
                  key={row.taggingWorkId}
                  className="bg-white text-center"
                >

                  <td className="border px-3 py-3 font-semibold">
                    {row.assignedTo}
                  </td>


                  <td className="border px-3 py-3">
                    {row.stockBoxName}
                  </td>


                  <td className="border px-3 py-3">
                    {row.itemName}
                  </td>


                  <td className="border px-3 py-3 font-bold text-blue-700">
                    {row.beforeTagCount}
                  </td>


                  <td className="border px-3 py-3 font-bold text-green-700">
                    {row.afterTagCount}
                  </td>


                  <td
                    className={`border px-3 py-3 font-bold ${
                      remaining === 0
                        ? "text-green-700"
                        : "text-orange-600"
                    }`}
                  >
                    {remaining}
                  </td>


                  <td className="border px-3 py-3">
                    {row.remarks?.trim()
                      ? row.remarks
                      : "-"}
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>


      {/* Mobile */}

      <div className="space-y-3 md:hidden">

        {taggingWorks.map((row) => {

          const remaining =
            Number(
              row.beforeTagCount || 0,
            ) -
            Number(
              row.afterTagCount || 0,
            );

          return (

            <div
              key={row.taggingWorkId}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
            >

              <div className="flex justify-between gap-3">

                <div>

                  <div className="text-xs text-gray-500">
                    Assigned To
                  </div>

                  <div className="font-bold text-violet-700">
                    {row.assignedTo}
                  </div>

                </div>


                <div className="text-right">

                  <div className="text-xs text-gray-500">
                    Remaining
                  </div>

                  <div
                    className={`font-bold ${
                      remaining === 0
                        ? "text-green-700"
                        : "text-orange-600"
                    }`}
                  >
                    {remaining}
                  </div>

                </div>

              </div>


              <div className="mt-3">

                <div className="text-xs text-gray-500">
                  Stock Box
                </div>

                <div className="font-semibold">
                  {row.stockBoxName}
                </div>

              </div>


              <div className="mt-2">

                <div className="text-xs text-gray-500">
                  Item Name
                </div>

                <div className="font-semibold">
                  {row.itemName}
                </div>

              </div>


              <div className="mt-3 grid grid-cols-3 gap-2">

                <div className="rounded-xl bg-white p-2 text-center">

                  <div className="text-[10px] text-gray-500">
                    Given
                  </div>

                  <div className="font-bold text-blue-700">
                    {row.beforeTagCount}
                  </div>

                </div>


                <div className="rounded-xl bg-white p-2 text-center">

                  <div className="text-[10px] text-gray-500">
                    Tagged
                  </div>

                  <div className="font-bold text-green-700">
                    {row.afterTagCount}
                  </div>

                </div>


                <div className="rounded-xl bg-white p-2 text-center">

                  <div className="text-[10px] text-gray-500">
                    Remaining
                  </div>

                  <div className="font-bold text-orange-600">
                    {remaining}
                  </div>

                </div>

              </div>


              <div className="mt-3 rounded-xl bg-white p-3">

                <div className="text-xs text-gray-500">
                  Remarks
                </div>

                <div className="mt-1 text-sm">
                  {row.remarks?.trim()
                    ? row.remarks
                    : "-"}
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </>

  )}

</div>
        

        <Box textAlign="center" mt={8}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default SalesDashboard;