package com.yourpath.ai;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private RecyclerView chatRecyclerView;
    private EditText messageInput;
    private Button sendButton;
    private ProgressBar progressBar;
    private ChatAdapter adapter;
    private List<Message> messages;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        messages = new ArrayList<>();
        adapter = new ChatAdapter(messages);

        chatRecyclerView = findViewById(R.id.chatRecyclerView);
        messageInput = findViewById(R.id.messageInput);
        sendButton = findViewById(R.id.sendButton);
        progressBar = findViewById(R.id.progressBar);

        chatRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        chatRecyclerView.setAdapter(adapter);

        sendButton.setOnClickListener(v -> sendMessage());
    }

    private void sendMessage() {
        String text = messageInput.getText().toString().trim();
        if (text.isEmpty()) {
            Toast.makeText(this, "Type a message", Toast.LENGTH_SHORT).show();
            return;
        }

        Message userMessage = new Message(text, true);
        adapter.addMessage(userMessage);
        messageInput.setText("");
        chatRecyclerView.scrollToPosition(messages.size() - 1);

        progressBar.setVisibility(android.view.View.VISIBLE);
        sendButton.setEnabled(false);

        ChatRequest request = new ChatRequest(text);
        ApiClient.getApiService().sendMessage(request).enqueue(new Callback<ChatResponse>() {
            @Override
            public void onResponse(Call<ChatResponse> call, Response<ChatResponse> response) {
                progressBar.setVisibility(android.view.View.GONE);
                sendButton.setEnabled(true);

                if (response.isSuccessful() && response.body() != null) {
                    String aiReply = response.body().getReply().getContent();
                    Message aiMessage = new Message(aiReply, false);
                    adapter.addMessage(aiMessage);
                    chatRecyclerView.scrollToPosition(messages.size() - 1);
                } else {
                    Toast.makeText(MainActivity.this, "Failed to get response", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ChatResponse> call, Throwable t) {
                progressBar.setVisibility(android.view.View.GONE);
                sendButton.setEnabled(true);
                Toast.makeText(MainActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
