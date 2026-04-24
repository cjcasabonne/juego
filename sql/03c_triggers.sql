DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

DROP TRIGGER IF EXISTS trg_couple_capacity ON couple_members;
CREATE TRIGGER trg_couple_capacity
BEFORE INSERT ON couple_members
FOR EACH ROW EXECUTE FUNCTION fn_check_couple_capacity();

DROP TRIGGER IF EXISTS trg_protect_phase_flags ON user_session_state;
CREATE TRIGGER trg_protect_phase_flags
BEFORE UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_protect_phase_flags();

DROP TRIGGER IF EXISTS trg_validate_answer_payload ON answers;
CREATE TRIGGER trg_validate_answer_payload
BEFORE INSERT OR UPDATE ON answers
FOR EACH ROW EXECUTE FUNCTION fn_validate_answer_payload();

DROP TRIGGER IF EXISTS trg_phase_advancement ON user_session_state;
CREATE TRIGGER trg_phase_advancement
AFTER UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_check_phase_advancement();

DROP TRIGGER IF EXISTS trg_score_prediction ON predictions;
CREATE TRIGGER trg_score_prediction
BEFORE INSERT ON predictions
FOR EACH ROW EXECUTE FUNCTION fn_calculate_prediction_score();
