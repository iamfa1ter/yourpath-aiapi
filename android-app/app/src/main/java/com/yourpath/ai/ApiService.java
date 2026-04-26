package com.yourpath.ai;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface ApiService {
    @POST("admission-chat")
    Call<ChatResponse> sendMessage(@Body ChatRequest request);
}
