/* Prompt builders for rewrite / format / reply */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function langName(code) {
    return (RB.LANGUAGE_NAMES && RB.LANGUAGE_NAMES[code]) || code;
  }

  function variantsFormat() {
    return `Return ONLY valid JSON (no markdown) with this shape:
{"variants":["...","...","..."]}
Rules:
- Provide exactly 3 complete alternatives.
- Keep the same meaning and requested tone.
- Make the variants meaningfully different in wording or structure.
- Each item is the full output — no numbering, labels, or commentary.`;
  }

  function appendExtraInstructions(extraInstructions, prompt) {
    const extra = String(extraInstructions || '').trim();
    if (!extra) return prompt;
    return `${prompt}

--- Extra instructions ---
${extra}
Follow the extra instructions, but still obey the output format required above.`;
  }

  function appendVoiceProfile(prompt, voiceSamples) {
    const samples = String(voiceSamples || '').trim();
    if (!samples) return prompt;
    return `${prompt}

--- Writer's voice ---
Match this writer's voice: vocabulary, sentence length, punctuation habits, and any mix of languages. Do not copy sentences verbatim.

${samples}`;
  }

  function withUserContent(input, extraInstructions, instruction, voiceSamples) {
    let prompt = appendExtraInstructions(extraInstructions, instruction);
    prompt = appendVoiceProfile(prompt, voiceSamples);
    const hasWrap =
      !!String(extraInstructions || '').trim() || !!String(voiceSamples || '').trim();
    if (!hasWrap) {
      return `${prompt}\n\n${input}`;
    }
    return `${prompt}

--- Text ---
${input}`;
  }

  RB.appendVoiceProfile = appendVoiceProfile;

  RB.buildRewritePrompt = function (input, tone, translation, extraInstructions, voiceSamples) {
    let instruction;
    if (translation && translation.enabled) {
      const toLangName = langName(translation.toLanguage);
      if (translation.fromLanguage === 'auto') {
        instruction = `First, translate the following text to ${toLangName}, then rewrite it in a ${tone} tone. The output should be in ${toLangName} and maintain a ${tone} style.`;
      } else {
        const fromLangName = langName(translation.fromLanguage);
        instruction = `First, translate the following text from ${fromLangName} to ${toLangName}, then rewrite it in a ${tone} tone. The output should be in ${toLangName} and maintain a ${tone} style.`;
      }
    } else {
      instruction = `Rewrite the following text in a ${tone} tone.`;
    }
    instruction += `\n${variantsFormat()}`;
    return withUserContent(input, extraInstructions, instruction, voiceSamples);
  };

  RB.buildFormatPrompt = function (formatType, input, extraInstructions) {
    const formatPrompts = {
      markdown:
        'Convert the following text to well-structured Markdown format with appropriate headers, lists, emphasis, and formatting. Return only the formatted Markdown:',
      html: 'Convert the following text to clean, semantic HTML with appropriate tags, headings, paragraphs, and lists. Return only the HTML code:',
      'bullet-points':
        'Convert the following text into clear, concise bullet points. Organize the information hierarchically with main points and sub-points where appropriate. Return only the bullet points:',
      'numbered-list':
        'Convert the following text into a well-organized numbered list. Use hierarchical numbering (1, 2, 3, then a, b, c, etc.) where appropriate. Return only the numbered list:',
      table: 'Convert the following text into a well-formatted table. Identify the key information and organize it into appropriate columns and rows. Use markdown table format. Return only the table:',
      outline:
        'Convert the following text into a detailed outline format with main topics, subtopics, and supporting details. Use standard outline formatting (I, A, 1, a, etc.). Return only the outline:',
      summary:
        'Convert the following text into a professional executive summary with key points, main findings, and actionable insights. Keep it concise but comprehensive. Return only the summary:',
      faq: 'Convert the following text into a FAQ (Frequently Asked Questions) format. Extract key information and present it as questions and answers. Return only the FAQ:'
    };
    const instruction = formatPrompts[formatType] || formatPrompts['bullet-points'];
    return withUserContent(input, extraInstructions, instruction);
  };

  RB.buildReplyPrompt = function (options) {
    const {
      channel,
      intent,
      tone,
      length,
      outputLanguage,
      incomingText,
      notes,
      extraInstructions,
      voiceSamples
    } = options;

    const outLang = langName(outputLanguage);
    const isEmail = channel === 'email';
    const channelDesc = isEmail
      ? 'a complete email (include a subject line on the first line as "Subject: ...", then a blank line, then the body)'
      : 'a chat/message reply suitable for Slack, Messenger, Zalo, or similar (no subject line)';

    const lengthMap = {
      short: 'Keep it brief — a few sentences at most.',
      medium: 'Use a moderate length — clear and complete without fluff.',
      long: 'Write a fuller response with enough detail and context.'
    };
    const lengthDesc = lengthMap[length] || lengthMap.medium;

    const intentMap = {
      accept: 'The goal is to accept / agree positively.',
      decline: 'The goal is to decline politely.',
      ask: 'The goal is to ask clarifying questions.',
      'follow-up': 'The goal is to follow up and nudge for a response or next step.',
      thank: 'The goal is to thank the other person.',
      general: 'Respond appropriately based on the context and notes.'
    };
    const intentDesc = intentMap[intent] || intentMap.general;

    const hasIncoming = !!(incomingText && incomingText.trim());
    const hasNotes = !!(notes && notes.trim());

    let task;
    if (hasIncoming && hasNotes) {
      task = `Write ${channelDesc} as a reply to the received message below. Use the writer's notes as guidance for what to say.`;
    } else if (hasIncoming) {
      task = `Write ${channelDesc} as a reply to the received message below. Infer a helpful, natural response.`;
    } else if (hasNotes) {
      task = `Compose a new ${channelDesc} from the writer's notes/ideas below (there is no incoming message).`;
    } else {
      return null;
    }

    let prompt = `${task}
Tone: ${tone}.
Intent: ${intentDesc}
Length: ${lengthDesc}
Write the entire output in ${outLang}.
${variantsFormat()}`;

    prompt = appendExtraInstructions(extraInstructions, prompt);
    prompt = appendVoiceProfile(prompt, voiceSamples);

    if (hasIncoming) {
      prompt += `\n\n--- Received message ---\n${incomingText.trim()}`;
    }
    if (hasNotes) {
      prompt += `\n\n--- Writer's notes ---\n${notes.trim()}`;
    }
    return prompt;
  };

  RB.buildRefinePrompt = function (currentText, instruction, voiceSamples, history) {
    const text = String(currentText || '').trim();
    const note = String(instruction || '').trim();
    if (!text || !note) return null;
    const convo = formatRefineConversation(history);
    let body = `Revise the following text according to the writer's instruction.
Keep the same language unless the instruction asks otherwise.
Honor the conversation below if present — it is previous adjustments to this same draft.
Return ONLY the revised text — no quotes, no JSON, no commentary, no numbering.`;
    if (convo) {
      body += `\n\n--- Conversation ---\n${convo}`;
    }
    body += `\n\n--- Instruction ---\n${note}`;
    return withUserContent(text, '', body, voiceSamples);
  };

  function formatRefineConversation(history) {
    const turns = Array.isArray(history) ? history : [];
    const lines = [];
    turns.forEach((turn) => {
      const text = String((turn && turn.text) || '').trim();
      if (!text) return;
      const role = turn && turn.role === 'assistant' ? 'Assistant' : 'User';
      lines.push(role + ': ' + text);
    });
    return lines.join('\n');
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
