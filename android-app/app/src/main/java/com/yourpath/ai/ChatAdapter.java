package com.yourpath.ai;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import android.widget.TextView;
import java.util.List;

public class ChatAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private List<Message> messages;
    private static final int VIEW_TYPE_USER = 0;
    private static final int VIEW_TYPE_AI = 1;

    public ChatAdapter(List<Message> messages) {
        this.messages = messages;
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isUser() ? VIEW_TYPE_USER : VIEW_TYPE_AI;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == VIEW_TYPE_USER) {
            return new UserMessageViewHolder(inflater.inflate(android.R.layout.simple_list_item_1, parent, false));
        } else {
            return new AiMessageViewHolder(inflater.inflate(android.R.layout.simple_list_item_1, parent, false));
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        Message message = messages.get(position);
        if (holder instanceof UserMessageViewHolder) {
            ((UserMessageViewHolder) holder).bind(message);
        } else {
            ((AiMessageViewHolder) holder).bind(message);
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    static class UserMessageViewHolder extends RecyclerView.ViewHolder {
        TextView textView;

        UserMessageViewHolder(@NonNull android.view.View itemView) {
            super(itemView);
            textView = itemView.findViewById(android.R.id.text1);
        }

        void bind(Message message) {
            textView.setText(message.getText());
        }
    }

    static class AiMessageViewHolder extends RecyclerView.ViewHolder {
        TextView textView;

        AiMessageViewHolder(@NonNull android.view.View itemView) {
            super(itemView);
            textView = itemView.findViewById(android.R.id.text1);
        }

        void bind(Message message) {
            textView.setText(message.getText());
        }
    }

    public void addMessage(Message message) {
        messages.add(message);
        notifyItemInserted(messages.size() - 1);
    }
}
