# frozen_string_literal: true

# Ok here is some rb

# [#hello#]
def foo
  puts 'hello world'
end

def dummy_flagr_aa_test(candidate_id)
  # This AA tests helps us validate flagr metrics
  # It shouldn't introduce any side effect
  # [#flagr:1#]
  FlagrService.evaluate(
    flag_id: 1, # https://flagr.checkrhq.net/#/flags/1
    entity_id: candidate_id.to_s,
    entity_type: 'candidate_int_id'
  )
end