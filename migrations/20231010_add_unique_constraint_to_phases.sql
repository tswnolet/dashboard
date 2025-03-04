ALTER TABLE phases
ADD CONSTRAINT unique_order UNIQUE (template_id, order_id);
