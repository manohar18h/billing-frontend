import axios from "axios";

const schemeApi = axios.create({
  baseURL: "https://api.hambirejewellery.com",
});



export type SchemeRegisterPayload = {
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  password: string;
  fullAddress: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;
};

export const sendSchemeOtp = async (phoneNumber: string) => {
  const res = await schemeApi.post("/scheme/auth/send-otp", {
    phoneNumber,
  });
  return res.data;
};

export const verifySchemeOtp = async (
  phoneNumber: string,
  otp: string,
) => {
  const res = await schemeApi.post("/scheme/auth/verify-otp", {
    phoneNumber,
    otp,
  });
  return res.data;
};

export const registerSchemeCustomer = async (
  data: SchemeRegisterPayload,
) => {
  const res = await schemeApi.post("/scheme/auth/register", data);
  return res.data;
};

export const loginSchemeCustomer = async (
  phoneNumber: string,
  password: string,
) => {
  const res = await schemeApi.post("/scheme/auth/login", {
    phoneNumber,
    password,
  });
  return res.data;
};

export const getSchemeDashboard = async (customerId: number) => {
  const res = await schemeApi.get(`/scheme/dashboard/${customerId}`);
  return res.data;
};

export const createPreBookingScheme = async (data: any) => {
  const res = await schemeApi.post("/scheme/pre-booking", data);
  return res.data;
};

export const createFlexi11Scheme = async (data: any) => {
  const res = await schemeApi.post("/scheme/flexi11", data);
  return res.data;
};

export const createQuickBuyScheme = async (data: any) => {
  const res = await schemeApi.post("/scheme/quick-buy", data);
  return res.data;
};
export const payFlexiMonth = async (data: {
  schemeId: number;
  paidAmount: number;
  ratePerGram: number;
  paymentMethod: string;
}) => {
  const res = await schemeApi.post("/scheme/flexi11/pay", data);
  return res.data;
};
export const checkSchemeMobile = async (phoneNumber: string) => {
  const res = await schemeApi.post("/scheme/auth/check-mobile", {
    phoneNumber,
  });
  return res.data;
};
export const checkForgotPasswordMobile = async (phoneNumber: string) => {
  const res = await schemeApi.post("/scheme/auth/forgot-password/check-mobile", {
    phoneNumber,
  });
  return res.data;
};

export const resetSchemePassword = async (
  phoneNumber: string,
  password: string,
) => {
  const res = await schemeApi.post("/scheme/auth/forgot-password/reset", {
    phoneNumber,
    password,
  });
  return res.data;
};
export const getSchemeCustomerProfile = async (customerId: number) => {
  const res = await schemeApi.get(`/scheme/auth/profile/${customerId}`);
  return res.data;
};

export const uploadSchemeProof = async (
  customerId: number,
  type: "ADDRESS" | "ID",
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await schemeApi.post(
    `/scheme/auth/profile/${customerId}/upload-proof?type=${type}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};
export const verifyAadhaarOcr = async (data: {
  file: File;
  name: string;
  aadhaarNumber: string;
}) => {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("name", data.name);
  formData.append("aadhaarNumber", data.aadhaarNumber);

  const res = await schemeApi.post(
    "/scheme/auth/verify-aadhaar-ocr",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};
export const verifyCustomerAadhaar = async (
  customerId: number,
  aadhaarNumber: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("aadhaarNumber", aadhaarNumber);
  formData.append("file", file);

  const res = await schemeApi.post(
    `/scheme/auth/profile/${customerId}/verify-aadhaar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};
