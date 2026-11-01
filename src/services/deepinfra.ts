export interface RemoveBackgroundParams {
  apiKey: string;
  imageBase64: string;
  preserveAlpha?: boolean;
  useProxy?: boolean;
}

export interface RemoveBackgroundResponse {
  imageUrl: string;
  runtimeMs: number;
  cost: number;
  requestId?: string;
}

/**
 * Gửi yêu cầu tách nền tới DeepInfra sử dụng mô hình Bria RMBG 2.0 (Bria/remove_background)
 */
export async function removeBackgroundViaDeepInfra({
  apiKey,
  imageBase64,
  preserveAlpha = true,
  useProxy = false,
}: RemoveBackgroundParams): Promise<RemoveBackgroundResponse> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập API Key của DeepInfra trước khi thực hiện.');
  }

  // Base URL: dùng Vite proxy hoặc direct URL
  const endpoint = useProxy
    ? '/api/deepinfra/v1/inference/Bria/remove_background'
    : 'https://api.deepinfra.com/v1/inference/Bria/remove_background';

  // Chuẩn hóa dữ liệu ảnh base64 (chấp nhận cả Data URL hoặc raw base64)
  const imagePayload = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const bodyData: Record<string, any> = {
    image: imagePayload,
  };

  if (preserveAlpha !== undefined) {
    bodyData.preserve_alpha = preserveAlpha;
  }

  const startTime = performance.now();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify(bodyData),
    });
  } catch (err: any) {
    throw new Error(
      `Không thể kết nối đến DeepInfra: ${err.message || 'Lỗi mạng hoặc CORS'}`
    );
  }

  const durationMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail =
        errJson.detail ||
        errJson.message ||
        errJson.error ||
        JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (response.status === 401) {
      throw new Error(
        'DeepInfra API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại khóa API của bạn.'
      );
    } else if (response.status === 402) {
      throw new Error(
        'Tài khoản DeepInfra không đủ số dư tín dụng để xử lý ảnh này.'
      );
    } else if (response.status === 429) {
      throw new Error(
        'Đã vượt quá giới hạn lượt gọi (Rate limit). Vui lòng thử lại sau vài giây.'
      );
    }

    throw new Error(
      `Lỗi từ DeepInfra (${response.status}): ${errorDetail || 'Yêu cầu không thành công'}`
    );
  }

  const result = await response.json();

  if (!result.images || !result.images.length) {
    throw new Error('API DeepInfra không trả về dữ liệu ảnh kết quả.');
  }

  const resultImageUrl = result.images[0];
  const cost = result.inference_status?.cost ?? 0.018;
  const runtimeMs = result.inference_status?.runtime_ms ?? durationMs;

  return {
    imageUrl: resultImageUrl,
    runtimeMs,
    cost,
    requestId: result.request_id,
  };
}

/**
 * Kiểm tra tính hợp lệ của API Key DeepInfra
 */
export async function testDeepInfraConnection(
  apiKey: string,
  useProxy = false
): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'API Key không được để trống.' };
  }

  const endpoint = useProxy
    ? '/api/deepinfra/v1/models'
    : 'https://api.deepinfra.com/v1/models';

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: 'Kết nối API DeepInfra thành công!' };
    }

    if (res.status === 401) {
      return {
        success: false,
        message: 'Khóa API không hợp lệ. Vui lòng kiểm tra lại.',
      };
    }

    return {
      success: false,
      message: `Mã phản hồi ${res.status}: Không thể xác thực với DeepInfra.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối: ${err.message || 'Không thể gửi yêu cầu.'}`,
    };
  }
}
